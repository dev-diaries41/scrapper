async function extractEmployees(page, sectionSelector) {
    const employeeListSelector = `${sectionSelector} ul li`;
    const employeeHandles = await page.$$(employeeListSelector);
  
    const employees = [];
  
    for (const employeeHandle of employeeHandles) {
      const employeeInfo = await extractEmployee(page, employeeHandle);
      if (employeeInfo) {
        employees.push(employeeInfo);
      }
    }
  
    return employees;
  }
  
  async function extractEmployee(page, employeeHandle) {
    const nameHandle = await employeeHandle.$('h3.base-main-card__title');
    const roleHandle = await employeeHandle.$('h4.base-main-card__subtitle');
  
    const name = nameHandle ? await nameHandle.evaluate(node => node.innerText.trim()) : null;
    const role = roleHandle ? await roleHandle.evaluate(node => node.innerText.trim()) : null;
  
    return { name, role };
  }


  export {extractEmployees}
  