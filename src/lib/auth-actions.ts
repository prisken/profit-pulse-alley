"use server";

import bcrypt from "bcrypt";

import { revalidatePath } from "next/cache";

import { auth, signOut } from "@/auth";
import { syncMemberSignupToCrm } from "@/lib/crm-member-sync";
import { prisma } from "@/lib/prisma";

const BCRYPT_SALT_ROUNDS = 12;

export type SignUpWithPasswordInput = {
  name: string;
  email: string;
  password: string;
  contactNumber: string;
};

export type SignUpWithPasswordResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function signUpWithPassword(
  input: SignUpWithPasswordInput,
): Promise<SignUpWithPasswordResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const contactNumber = input.contactNumber.trim();

  if (!name) {
    return { success: false, error: "Name is required." };
  }

  if (!email) {
    return { success: false, error: "Email is required." };
  }

  if (!password) {
    return { success: false, error: "Password is required." };
  }

  if (password.length < 8) {
    return {
      success: false,
      error: "Password must be at least 8 characters.",
    };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return {
        success: false,
        error: "An account with this email already exists.",
      };
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        contactNumber: contactNumber || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        contactNumber: true,
        role: true,
        createdAt: true,
      },
    });

    await syncMemberSignupToCrm({
      userId: user.id,
      email: user.email,
      name: user.name,
      contactNumber: user.contactNumber,
      provider: "credentials",
      role: user.role,
      signedUpAt: user.createdAt,
      source: "Profit Pulse Ally Password Signup",
    });

    return {
      success: true,
      message: "Account created successfully. You can sign in now.",
    };
  } catch (error) {
    console.error("[auth-actions] signUpWithPassword failed:", error);
    return {
      success: false,
      error: "Could not create account. Please try again later.",
    };
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export type UpdateContactNumberResult =
  | { success: true }
  | { success: false; error: string };

export async function updateContactNumber(
  contactNumber: string,
): Promise<UpdateContactNumberResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to continue." };
  }

  const trimmed = contactNumber.trim();
  if (!trimmed) {
    return { success: false, error: "Contact number is required." };
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { contactNumber: trimmed },
      select: {
        id: true,
        email: true,
        name: true,
        contactNumber: true,
        role: true,
        createdAt: true,
      },
    });

    await syncMemberSignupToCrm({
      userId: user.id,
      email: user.email,
      name: user.name,
      contactNumber: user.contactNumber,
      provider: "google-or-onboarding",
      role: user.role,
      signedUpAt: user.createdAt,
      source: "Profit Pulse Ally OAuth Onboarding",
    });

    revalidatePath("/profile");

    return { success: true };
  } catch (error) {
    console.error("[auth-actions] updateContactNumber failed:", error);
    return {
      success: false,
      error: "Could not save your contact number. Please try again.",
    };
  }
}
