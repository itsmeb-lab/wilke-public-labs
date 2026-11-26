const checkPermission = {
  heading: 'Confirm which items can go first',
  detail: 'Get approval from the owner or authorized representative. Set disputed or unapproved belongings aside and consult the Wisconsin rental guide if it applies.',
  link: 'https://datcp.wi.gov/Pages/Publications/LandlordTenantGuide.aspx',
  linkLabel: 'Read Wisconsin’s landlord and tenant guide',
};
const specialHandling = {
  heading: 'Check the collection route for those materials',
  detail: 'A TV, large appliance, tire or renovation debris may need a different collector or fee. List those items individually before putting them out or requesting a quote.',
  link: '../milwaukee-bulky-items/',
  linkLabel: 'Check item-by-item collection rules',
};

export function chooseRoute({ authority, handling, items }) {
  if (authority === 'unresolved') return checkPermission;
  if (authority !== 'cleared') return { heading: 'Choose who can approve removal first' };

  if (items === 'hazards') {
    return {
      heading: 'Confirm separate handling before moving the material',
      detail: 'Keep these materials out of the ordinary cleanout scope until the collection program or an appropriate specialist confirms acceptance. MMSD lists household eligibility and accepted items.',
      link: 'https://www.mmsd.com/what-you-can-do/home-haz-mat-collection',
      linkLabel: 'Check MMSD household hazardous waste eligibility',
    };
  }
  if (items === 'separate') return specialHandling;
  if (!['self', 'crew'].includes(handling) || !['bulky', 'reusable', 'mixed'].includes(items)) {
    return { heading: 'Choose the work needed and the type of items' };
  }
  if (handling === 'crew') {
    return {
      heading: 'Ask for a written room-by-room cleanout quote',
      detail: items === 'reusable'
        ? 'Ask whether a donation pickup can take eligible items first. Use the remaining room list and actual loading access when asking for a cleanout price.'
        : 'Record the rooms, stairs and loading distance. Ask what disposal and sweep-up include, when the crew can finish, and what triggers an extra charge.',
      link: '#quote-scope',
      linkLabel: 'Prepare the quote scope',
    };
  }
  if (items === 'reusable') {
    return {
      heading: 'Check donation pickup or drop-off first',
      detail: 'Confirm that the organization takes the items and can collect from your pickup location. Ask whether stairs or other access details affect the pickup.',
      link: 'https://city.milwaukee.gov/recycle/Reduce-Reuse/Donating',
      linkLabel: 'See Milwaukee donation resources',
    };
  }
  if (items === 'mixed') {
    return {
      heading: 'Separate the load before you set it out',
      detail: 'Create separate lists for reusable furniture, ordinary bulky items, and items such as electronics or debris. Your city or collector can tell you what it will take and where each group goes.',
      link: '../milwaukee-bulky-items/#mixed-cleanout',
      linkLabel: 'Check where a mixed cleanout load can go',
    };
  }
  return {
    heading: 'Check local bulky pickup before paying for hauling',
    detail: 'Use the property’s actual collector. Compare size, weight, fee and scheduling rules. Confirm that you can move the items to the required collection point.',
    link: '#municipalities',
    linkLabel: 'Compare city pickup rules',
  };
}
