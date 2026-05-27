"use server"

import { signIn } from "../../../../auth"
import { AuthError } from "next-auth"

export default async function loginAction(_prevState: any, formData: FormData): Promise<any> {

    try {
        await signIn('credentials', {
            email: formData.get('email') as string,
            password: formData.get('password') as string,
            redirect: true,
            redirectTo: '/dashboard'
        });
        return { sucess: true }
    } catch (error) {
        if (error instanceof AuthError) {
            if (error.type === 'CredentialsSignin') {
                return {
                    sucess: false,
                    message: "Email ou senha inválidos.",
                };
            }
            return { sucess: false, message: 'Ops, ocorreu um erro inesperado' }
        }

        throw error;
    }
}