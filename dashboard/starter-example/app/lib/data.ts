import { sql } from '@vercel/postgres';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';
// import { revenue, invoicesId, customers } from './placeholder-data';


// function fillCustomerMap() {
//   const customersMap = new Map();
//   customers.map((customer) => {
//     customersMap.set(customer.id, customer)
//   })
//   return customersMap;
// }

// function getCustomerInvoices() {
//   const customersMap = fillCustomerMap();
//   let invoicesCustomer: Array<InvoicesTable> = [];

//   invoicesId.map((invoice) => {
//     let customer = customersMap.get(invoice.customer_id);
//     invoicesCustomer.push({
//       id: invoice.id,
//       customer_id: invoice.customer_id,
//       amount: invoice.amount,
//       status: invoice.status == 'pending' ? 'pending' : 'paid',
//       date: invoice.date,
//       name: customer.name,
//       email: customer.email,
//       image_url: customer.image_url,
//     })
//   })
//   return invoicesCustomer;
// }

// function getInvoiceCustomerOrderDate() {
//   return getCustomerInvoices().slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
// }

// function getFilteredInvoices(
//   query: string,
// ) {
//   if (query.length == 0) return getInvoiceCustomerOrderDate()

//   return getInvoiceCustomerOrderDate().filter((invoices) => {
//     if (invoices.name.includes(query)) return invoices
//     if (invoices.email.includes(query)) return invoices
//     if (String(invoices.amount).includes(query)) return invoices
//     if (invoices.status.includes(query)) return invoices
//   })
// }

// export async function fetchRevenue() {
//   return revenue;
// }

// export async function fetchLatestInvoices() {
//   const latestInvoices = getInvoiceCustomerOrderDate().slice(0, 5).map((invoice) => ({
//     ...invoice,
//     amount: formatCurrency(invoice.amount),
//   }))
//   return latestInvoices
// }

// export async function fetchCardData() {
//   return {
//     numberOfInvoices: Number(invoicesId.length ?? '0'),
//     numberOfCustomers: Number(customers.length ?? '0'),
//     // totalPaidInvoices: formatCurrency(100626),
//     totalPaidInvoices: formatCurrency(invoicesId.reduce((acc, invoice) => invoice.status == 'paid' ? acc += invoice.amount : acc, 0)),
//     // totalPendingInvoices: formatCurrency(125632),
//     totalPendingInvoices: formatCurrency(invoicesId.reduce((acc, invoice) => invoice.status == 'pending' ? acc += invoice.amount : acc, 0)),
//   }
// }

// const ITEMS_PER_PAGE = 6;
// export async function fetchFilteredInvoices(
//   query: string,
//   currentPage: number,
// ) {
//   let start = ITEMS_PER_PAGE * (currentPage - 1)
//   let end = start + ITEMS_PER_PAGE - 1
//   return getFilteredInvoices(query).slice(start, end);
// }

// export async function fetchInvoicesPages(query: string) {
//   const totalPages = Math.ceil(Number(getFilteredInvoices(query).length) / ITEMS_PER_PAGE);
//   return totalPages
// }

// export async function fetchInvoiceById(id: string) {
//   let invoice = invoicesId.find((invoices) => invoices.id == id) || null;
//   if (invoice !== null) {
//     invoice = {
//       ...invoice,
//       amount: invoice.amount / 100,
//     }
//   }
//   return invoice;
// }

// export async function fetchCustomers() {
//   return customers.sort((a, b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0)
// }

// export async function fetchFilteredCustomers(query: string) {
//   const filteredCustomers = customers.map((customer) => {
//     let customerInvoices = invoicesId.filter((inv) => inv.customer_id == customer.id);
//     let total_pending = customerInvoices.reduce((acc, inv) => {
//       if (inv.status == 'pending') {
//         acc += inv.amount;
//       }
//       return acc
//     }, 0)
//     let total_paid = customerInvoices.reduce((acc, inv) => {
//       if (inv.status == 'pending') {
//         acc += inv.amount;
//       }
//       return acc
//     }, 0)

//     return {
//       ...customer,
//       total_invoice: customerInvoices.length,
//       total_pending: total_pending,
//       total_paid: total_paid,
//     }
//   })

//   filteredCustomers.sort((a, b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0)
//   if (query.length == 0) return filteredCustomers
//   return filteredCustomers.filter((cus) => cus.name.includes(query) || cus.email.includes(query))
// }



export async function fetchRevenue() {
  try {
    // Искусственная задержка ответа в демонстрационных целях.
    // не делай этого в производстве :)

    // console.log('Fetching revenue data...');
    // await new Promise((resolve) => setTimeout(resolve, 3000));

    const data = await sql<Revenue>`SELECT * FROM revenue`;

    // console.log('Data fetch completed after 3 seconds.');

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {
    const data = await sql<LatestInvoiceRaw>`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`;

    const latestInvoices = data.rows.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));

    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const invoiceStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`;

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(data[0].rows[0].count ?? '0');
    const numberOfCustomers = Number(data[1].rows[0].count ?? '0');
    const totalPaidInvoices = formatCurrency(data[2].rows[0].paid ?? '0');
    const totalPendingInvoices = formatCurrency(data[2].rows[0].pending ?? '0');

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const invoices = await sql<InvoicesTable>`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return invoices.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const count = await sql`SELECT COUNT(*)
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      invoices.date::text ILIKE ${`%${query}%`} OR
      invoices.status ILIKE ${`%${query}%`}
  `;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const data = await sql<InvoiceForm>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id};
    `;

    const invoice = data.rows.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));

    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.')
  }
}

export async function fetchCustomers() {
  try {
    const data = await sql<CustomerField>`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `;

    const customers = data.rows;
    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    const data = await sql<CustomersTableType>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;

    const customers = data.rows.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}
