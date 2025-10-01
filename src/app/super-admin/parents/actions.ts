
"use server";

import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { app } from "@/lib/firebase";

export async function createLoginCredentials(email: string, phone: string) {
    if (!email) {
        return { error: "শিক্ষার্থীর জন্য কোনো ইমেল পাওয়া যায়নি।" };
    }
    if (!phone) {
        return { error: "শিক্ষার্থীর জন্য কোনো ফোন নম্বর পাওয়া যায়নি।" };
    }

    const auth = getAuth(app);
    // Use student's phone number as the password
    const password = phone; 

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return { 
            success: `সফলভাবে লগইন তৈরি করা হয়েছে। ইমেইল: ${email}, পাসওয়ার্ড: ${phone}`
        };
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            return { error: "এই ইমেল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা আছে।" };
        }
        console.error("Error creating user:", error);
        return { error: "লগইন তৈরি করতে একটি ত্রুটি ঘটেছে।" };
    }
}

