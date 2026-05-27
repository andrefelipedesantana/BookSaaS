'use server'

import db from "@/lib/db";
import { hashSync } from "bcrypt-ts";

export default async function registerAction(_prevState: any, formData: FormData): Promise<any> {

    const entradas = Array.from(formData.entries());

    const data = Object.fromEntries(entradas);

    if (!data.email || !data.password || !data.name) {
        return {
            sucess: false,
            message: "Todos os campos devem ser preenchidos."
        };
    }

    const user = await db.user.findFirst({
        where: {
            email: data.email as string,
        }
    })

    if (user) {
        return {
            sucess: false,
            message: "Usuário já existe."
        };
    }

    const hashedPassword = hashSync(data.password as string);

    await db.user.create({
        data: {
            name: data.name as string,
            email: data.email as string,
            password: hashedPassword
        }
    })

    return {
        sucess: true,
        message: "Cadastro realizado com sucesso!",
    };
}