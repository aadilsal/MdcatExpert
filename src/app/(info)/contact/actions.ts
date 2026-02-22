"use server";

import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const contactSchema = z.object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    email: z.string().email("Invalid email address"),
    subject: z.string().min(1, "Please select a subject"),
    message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactState = {
    error?: string;
    success?: boolean;
    fieldErrors?: Record<string, string[]>;
};

export async function sendContactEmail(prevState: ContactState | null, formData: FormData): Promise<ContactState> {
    const data = {
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        email: formData.get("email") as string,
        subject: formData.get("subject") as string,
        message: formData.get("message") as string,
    };

    // 1. Validate
    const result = contactSchema.safeParse(data);
    if (!result.success) {
        return {
            fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
        };
    }

    try {
        // 2. Send Email
        const { error } = await resend.emails.send({
            from: "MdcatXpert <onboarding@resend.dev>", // Note: For sandbox, only verified emails/onboarding email works
            to: ["support@mdcatxpert.com"], // Point to the support email
            subject: `Contact Form: ${data.subject} from ${data.firstName} ${data.lastName}`,
            replyTo: data.email,
            html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Subject:</strong> ${data.subject}</p>
                <p><strong>Message:</strong></p>
                <p>${data.message.replace(/\n/g, "<br/>")}</p>
            `,
        });

        if (error) {
            console.error("Resend error:", error);
            return { error: "Failed to send email. Please try again later." };
        }

        return { success: true };
    } catch (err) {
        console.error("Contact error:", err);
        return { error: "An unexpected error occurred. Please try again later." };
    }
}
