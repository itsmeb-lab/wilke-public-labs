import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, it } from 'node:test';
import { ReliabilityEngine } from '../automation-reliability-lab/core.mjs';

// Execute the actual browser module against a minimal DOM, not a copied renderer.
// Any HTML sink access fails the fixture. Real browser coverage is a separate gate.
class Element {
  constructor(tag = 'div') {
    this.tagName = tag;
    this.children = [];
    this.className = '';
    this.attributes = {};
    this.dataset = {};
    this.listeners = {};
    this.classList = { add() {}, remove() {} };
    this._text = '';
    this.value = '';
  }
  set textContent(value) { this._text = String(value); this.children = []; }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  set innerHTML(_value) { throw new Error('HTML sink used'); }
  get innerHTML() { throw new Error('HTML sink read'); }
  append(child) {
    if (child.tagName === '#fragment') this.children.push(...child.children);
    else this.children.push(child);
  }
  replaceChildren(...children) { this.children = []; this._text = ''; for (const child of children) this.append(child); }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  focus() {}
}

function fixture() {
  const elements = new Map();
  const document = {
    getElementById(id) { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); },
    createElement(tag) { return new Element(tag); },
    createDocumentFragment() { return new Element('#fragment'); },
    querySelectorAll() { return []; },
    querySelector() { return null; },
  };
  const source = readFileSync(new URL('../automation-reliability-lab/app.js', import.meta.url), 'utf8');
  const importLine = 'import { ReliabilityEngine } from "./core.mjs";';
  assert.equal(source.split(importLine).length, 2, 'Exactly one expected module import');
  const context = vm.createContext({ document, ReliabilityEngine, Date, setTimeout, clearTimeout });
  vm.runInContext(source.replace(importLine, ''), context, { timeout: 1000 });
  return { elements, context, evaluate: (code) => vm.runInContext(code, context, { timeout: 1000 }) };
}

describe('actual receipt renderer with synthetic DOM', () => {
  it('shows the empty-state row without interpreting HTML', () => {
    const { elements } = fixture();
    const body = elements.get('receiptBody');
    assert.equal(body.children.length, 1);
    assert.equal(body.children[0].className, 'empty-row');
    assert.equal(body.children[0].children[0].colSpan, 5);
    assert.equal(body.textContent, 'Run a scenario to generate evidence.');
  });
  it('preserves markup, ampersands and Unicode as literal receipt text', () => {
    const { context, elements, evaluate } = fixture();
    const input = '<b data-text-only>synthetic café & "quote"</b>';
    context.syntheticKey = input;
    evaluate('engine.start(syntheticKey, "success"); render();');
    const rows = elements.get('receiptBody').children;
    assert.ok(rows.length > 0);
    assert.ok(rows.every(row => row.children.length === 5));
    const details = rows.map(row => row.children[3]);
    assert.ok(details.some(cell => cell.textContent.includes(input)));
    assert.ok(details.every(cell => cell.children.length === 0), 'Text creates no nested elements');
  });
  it('keeps newest events first without mutating engine history', () => {
    const { elements, evaluate } = fixture();
    evaluate('engine.start("synthetic", "recover"); render();');
    const rows = elements.get('receiptBody').children;
    const count = evaluate('engine.events.length');
    assert.equal(rows[0].children[0].textContent, String(count));
    assert.equal(rows.at(-1).children[0].textContent, '1');
    assert.equal(evaluate('engine.events[0].seq'), 1);
    assert.equal(rows[0].children[2].className, 'event-name');
    assert.equal(rows[0].children[4].className, 'state-warn');
  });
  it('clears prior rows on reset and retains truthful counts', () => {
    const { elements, evaluate } = fixture();
    evaluate('engine.start("synthetic", "success"); render(); resetDemo();');
    assert.equal(elements.get('receiptCount').textContent, '0 events');
    assert.equal(elements.get('runsStat').textContent, '0');
    assert.equal(elements.get('receiptBody').children.length, 1);
    assert.equal(elements.get('stateChip').textContent, 'IDLE');
  });
});
