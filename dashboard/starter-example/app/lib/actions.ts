'use server';

import { z } from 'zod';
import { invoicesId } from '@/app/lib/placeholder-data';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  console.log()
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
  const id = invoicesId[invoicesId.length - 1].id + 1;
  invoicesId.push({
    id,
    customer_id :customerId,
    amount: amountInCents,
    status,
    date
  })

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
  // Test it out:

}