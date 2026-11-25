export const catalog = {
  "snapshotId": "published-policy-examples-20261125-v3",
  "checkedOn": "2026-11-25",
  "sources": [
    {
      "id": "sc-des-union",
      "label": "SC Department of Environmental Services — Union County",
      "url": "https://des.sc.gov/community/recycling-waste-reduction/where-recycle/union-county-recycling-locations",
      "checkedOn": "2026-11-25"
    },
    {
      "id": "union-holidays-2026",
      "label": "Union County — 2026 recycling closure calendar",
      "url": "https://gearupunionsc.com/wp-content/uploads/2026/06/Recycle-Holiday-List-2026.pdf",
      "checkedOn": "2026-11-25"
    },
    {
      "id": "perry-notary",
      "label": "Perry Memorial Library — notary policy",
      "url": "https://www.perrylibrary.org/using-the-library/notary-services",
      "checkedOn": "2026-11-25"
    },
    {
      "id": "onslow-notary",
      "label": "Onslow County Library — notary policy",
      "url": "https://www.onslowcountync.gov/1861/Request-Notary-Service",
      "checkedOn": "2026-11-25"
    },
    {
      "id": "haywood-services",
      "label": "Haywood County Library — printing and notary",
      "url": "https://hhsa.haywoodcountync.gov/648/Mobile-Printing-Faxing-Notary-Services",
      "checkedOn": "2026-11-25"
    },
    {
      "id": "rowan-ky-services",
      "label": "Rowan County Public Library, Kentucky — clerical services",
      "url": "https://www.rowancountylibrary.org/clerical",
      "checkedOn": "2026-11-25"
    },
    {
      "id": "charlotte-hotspots",
      "label": "Charlotte Mecklenburg Library — hotspot borrowing rules",
      "url": "https://www.cmlibrary.org/services/computer-internet",
      "checkedOn": "2026-11-25"
    },
    {
      "id": "clayton-things",
      "label": "Hocutt-Ellington Memorial Library — Library of Things",
      "url": "https://www.claytonlibrarync.org/895/Library-of-Things",
      "checkedOn": "2026-11-25"
    }
  ],
  "closureCalendars": [
    {
      "jurisdictionId": "us-sc-union-county",
      "group": "county-recycling",
      "year": 2026,
      "sourceId": "union-holidays-2026",
      "dates": [
        "2026-01-19",
        "2026-04-03",
        "2026-05-25",
        "2026-07-04",
        "2026-09-07",
        "2026-11-11",
        "2026-11-26",
        "2026-12-24",
        "2026-12-25"
      ]
    }
  ],
  "places": [
    {
      "region": "SC",
      "jurisdictionId": "us-sc-union-county",
      "scheduleGroup": "county-recycling",
      "id": "union-airport",
      "name": "Station #9 Airport",
      "locality": "Union",
      "address": "570 Sardis Road, Union, SC 29379",
      "schedule": {
        "days": [
          1,
          3,
          5,
          6
        ],
        "label": "Published regular pattern: Monday, Wednesday, Friday and Saturday, 8 a.m.–6 p.m. local time.",
        "sourceId": "sc-des-union"
      },
      "policies": {
        "electronics": {
          "fit": "described",
          "summary": "The state agency identifies Airport as the county collection location for household electronics.",
          "sourceIds": [
            "sc-des-union"
          ],
          "conditions": [
            "Confirm current program eligibility and site access before traveling."
          ]
        },
        "farmer_oil": {
          "fit": "excluded",
          "summary": "The state agency directs farmer oil to Cross Keys.",
          "sourceIds": [
            "sc-des-union"
          ],
          "redirectPlaceId": "union-cross-keys"
        },
        "paint": {
          "fit": "unstated",
          "summary": "The state listing names paint but does not resolve preparation details in this snapshot.",
          "sourceIds": [
            "sc-des-union"
          ]
        }
      },
      "scheduleAppliesTo": [
        "electronics",
        "farmer_oil",
        "paint"
      ]
    },
    {
      "region": "SC",
      "jurisdictionId": "us-sc-union-county",
      "scheduleGroup": "county-recycling",
      "id": "union-cross-keys",
      "name": "Station #10 Cross Keys",
      "locality": "Union",
      "address": "4012 Cross Keys Highway, Union, SC 29379",
      "schedule": {
        "days": [
          2,
          4,
          6
        ],
        "label": "Published regular pattern: Tuesday/Thursday noon–6 p.m.; Saturday 8 a.m.–6 p.m. local time.",
        "sourceId": "sc-des-union"
      },
      "policies": {
        "farmer_oil": {
          "fit": "described",
          "summary": "The state agency identifies Cross Keys for farmer oil collection.",
          "sourceIds": [
            "sc-des-union"
          ],
          "conditions": [
            "The published program limit is 55 gallons; confirm eligibility and handling requirements with the agency."
          ]
        },
        "electronics": {
          "fit": "excluded",
          "summary": "The state agency directs household electronics to Airport.",
          "sourceIds": [
            "sc-des-union"
          ],
          "redirectPlaceId": "union-airport"
        },
        "paint": {
          "fit": "unstated",
          "summary": "The state listing names paint but does not resolve preparation details in this snapshot.",
          "sourceIds": [
            "sc-des-union"
          ]
        }
      },
      "scheduleAppliesTo": [
        "electronics",
        "farmer_oil",
        "paint"
      ]
    },
    {
      "region": "SC",
      "jurisdictionId": "us-sc-union-county",
      "scheduleGroup": "county-recycling",
      "id": "union-jonesville",
      "name": "Station #6 Jonesville",
      "locality": "Jonesville",
      "address": "299 Long Avenue, Jonesville, SC 29353",
      "schedule": {
        "days": [
          1,
          3,
          5,
          6
        ],
        "label": "Published regular pattern: Monday, Wednesday, Friday and Saturday, 8 a.m.–6 p.m. local time.",
        "sourceId": "sc-des-union"
      },
      "policies": {
        "electronics": {
          "fit": "excluded",
          "summary": "The state agency directs household electronics to Airport, rather than this station.",
          "sourceIds": [
            "sc-des-union"
          ],
          "redirectPlaceId": "union-airport"
        },
        "farmer_oil": {
          "fit": "excluded",
          "summary": "The state agency directs farmer oil to Cross Keys.",
          "sourceIds": [
            "sc-des-union"
          ],
          "redirectPlaceId": "union-cross-keys"
        },
        "paint": {
          "fit": "unstated",
          "summary": "The state listing names paint but does not resolve preparation details in this snapshot.",
          "sourceIds": [
            "sc-des-union"
          ]
        }
      },
      "scheduleAppliesTo": [
        "electronics",
        "farmer_oil",
        "paint"
      ]
    },
    {
      "id": "perry-memorial",
      "name": "Perry Memorial Library",
      "region": "NC",
      "locality": "Henderson",
      "jurisdictionId": "us-nc-henderson-27536",
      "address": "205 Breckenridge Street, Henderson, NC 27536",
      "schedule": {
        "days": [
          1,
          2,
          3,
          4,
          5
        ],
        "label": "Posted notary window: weekdays 10 a.m.–5 p.m. local time.",
        "sourceId": "perry-notary"
      },
      "policies": {
        "vehicle_title": {
          "fit": "described",
          "summary": "The library's policy describes vehicle-title notarization with the seller present.",
          "sourceIds": [
            "perry-notary"
          ],
          "conditions": [
            "The seller must sign and date in front of the notary.",
            "The page says appointments are not required.",
            "Follow the source's current ID and witness instructions."
          ]
        },
        "basic_notary": {
          "fit": "described",
          "summary": "The page describes notary service during its posted weekday window.",
          "sourceIds": [
            "perry-notary"
          ],
          "conditions": [
            "Follow the official document, identification and witness requirements."
          ]
        }
      },
      "scheduleAppliesTo": [
        "vehicle_title",
        "basic_notary"
      ]
    },
    {
      "id": "onslow-jacksonville",
      "name": "Jacksonville Main Library",
      "region": "NC",
      "locality": "Jacksonville",
      "jurisdictionId": "us-nc-onslow-county",
      "address": "58 Doris Avenue East, Jacksonville, NC 28540",
      "schedule": {
        "days": [
          1,
          2,
          3,
          4,
          5
        ],
        "label": "Posted notary window: weekdays 9 a.m.–5 p.m., by appointment.",
        "sourceId": "onslow-notary"
      },
      "policies": {
        "vehicle_title": {
          "fit": "excluded",
          "summary": "The library explicitly excludes DMV forms and vehicle titles from its notary service.",
          "sourceIds": [
            "onslow-notary"
          ]
        },
        "basic_notary": {
          "fit": "described",
          "summary": "The county describes basic notary service by appointment.",
          "sourceIds": [
            "onslow-notary"
          ],
          "conditions": [
            "The posted limit is three documents per person per visit.",
            "Bring the required signers, witnesses and identification; the library does not supply witnesses."
          ],
          "fee": "The checked page describes this notary service as free."
        }
      },
      "scheduleAppliesTo": [
        "vehicle_title",
        "basic_notary"
      ]
    },
    {
      "id": "haywood-waynesville",
      "name": "Waynesville Branch, Haywood County Library",
      "region": "NC",
      "locality": "Waynesville",
      "jurisdictionId": "us-nc-haywood-county",
      "address": null,
      "schedule": {
        "days": [
          1,
          2,
          3,
          4,
          5
        ],
        "label": "Notary appointments are described for Monday–Friday; confirm the appointment time.",
        "sourceId": "haywood-services"
      },
      "policies": {
        "vehicle_title": {
          "fit": "unstated",
          "summary": "The checked page does not state whether vehicle titles are handled.",
          "sourceIds": [
            "haywood-services"
          ]
        },
        "basic_notary": {
          "fit": "described",
          "summary": "The page describes weekday notary appointments at Waynesville and Canton.",
          "sourceIds": [
            "haywood-services"
          ],
          "conditions": [
            "Arrange an appointment and bring any required witness; library staff and patrons cannot act as witnesses."
          ]
        },
        "printing": {
          "fit": "described",
          "summary": "The page describes mobile printing, with a daily limit.",
          "sourceIds": [
            "haywood-services"
          ],
          "conditions": [
            "The stated maximum is 50 prints per day."
          ],
          "fee": "The posted printing rate is $0.20 per page."
        }
      },
      "scheduleAppliesTo": [
        "vehicle_title",
        "basic_notary"
      ]
    },
    {
      "id": "rowan-morehead-ky",
      "name": "Rowan County Public Library",
      "region": "KY",
      "locality": "Morehead",
      "jurisdictionId": "us-ky-rowan-county",
      "address": "175 Beacon Hill Road, Morehead, KY 40351",
      "schedule": {
        "days": [
          1,
          2,
          3,
          4,
          5,
          6
        ],
        "label": "The notary policy refers to normal Monday–Saturday library hours; confirm current hours and staff.",
        "sourceId": "rowan-ky-services"
      },
      "policies": {
        "vehicle_title": {
          "fit": "excluded",
          "summary": "This Kentucky library excludes notarization relating to motorized vehicles.",
          "sourceIds": [
            "rowan-ky-services"
          ]
        },
        "basic_notary": {
          "fit": "described",
          "summary": "The page describes basic notary service during normal library hours, subject to staff availability.",
          "sourceIds": [
            "rowan-ky-services"
          ],
          "conditions": [
            "Use the library's current identification and residence instructions."
          ],
          "fee": "The checked page describes notary service as free."
        },
        "printing": {
          "fit": "described",
          "summary": "The page describes library printing and copying.",
          "sourceIds": [
            "rowan-ky-services"
          ],
          "conditions": [
            "Confirm the applicable print settings and current service arrangements."
          ],
          "fee": "The first 10 pages are described as free, with additional pages at $0.10 each."
        }
      },
      "scheduleAppliesTo": [
        "vehicle_title",
        "basic_notary"
      ]
    },
    {
      "id": "charlotte-hotspots-program",
      "recordKind": "program",
      "name": "Charlotte Mecklenburg Library — hotspot program",
      "region": "NC",
      "locality": "Mecklenburg County",
      "jurisdictionId": "us-nc-mecklenburg-county",
      "address": null,
      "policies": {
        "hotspot_borrowing": {
          "fit": "described",
          "summary": "The library describes a seven-day hotspot loan, subject to borrower requirements and the reservation queue.",
          "sourceIds": [
            "charlotte-hotspots"
          ],
          "conditions": [
            "Borrowers must be 18+ with a valid Charlotte Mecklenburg Library card, current government photo ID and a library-account balance below $10.",
            "The limit is one hotspot per borrower; the published loan is seven days without renewal.",
            "Return the equipment to staff at a library location, rather than a book drop. Use is restricted to the continental United States.",
            "Check the source for overdue service cutoff and replacement charges. The lab does not calculate fees or predict stock and wait time."
          ]
        }
      }
    },
    {
      "id": "clayton-things-program",
      "recordKind": "program",
      "name": "Hocutt-Ellington Memorial Library — Library of Things",
      "region": "NC",
      "locality": "Clayton",
      "jurisdictionId": "us-nc-clayton-27520",
      "address": null,
      "policies": {
        "things_borrowing": {
          "fit": "described",
          "summary": "The library describes borrowing non-book items, with separate kit and technology limits.",
          "sourceIds": [
            "clayton-things"
          ],
          "conditions": [
            "Age 18+ and a valid Hocutt-Ellington Memorial Library card are required.",
            "The published limit is two kit items plus one technology item at a time. Technology items have additional lending rules.",
            "The cardholder is responsible for missing or damaged items and related repair or replacement charges.",
            "Check the operator's catalog and item-specific rules for current availability and pickup arrangements."
          ]
        }
      }
    }
  ]
};
