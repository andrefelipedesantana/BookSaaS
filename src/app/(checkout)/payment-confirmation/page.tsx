import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";

export default async function CheckoutReturnPage() {
    return <Card >
        <CardContent className="max-w-lg mt-10 text-center">
            <CardHeader>
                <ShoppingBag size={60} strokeWidth={1} className="text-green-500 mx-auto mb-4 w-12 h-12" />
                <CardTitle className="mb-2">Assinatura Confirmada</CardTitle>
                <CardDescription>
                    Obrigado por assinar nosso plano premium!
                </CardDescription>
            </CardHeader>
            <div className="py-8 space-y-2 ">
                <p className="text-muted-foreground">Sua assinatura foi processada com sucesso e sua conta está ativa</p>
                <p className="text-muted-foreground">Agora é só aproveitar o nosso conteúdo exclusivo</p>
            </div>
            <Button className="w-full" asChild>
                <Link href="/dashboard">Continuar para o Dashboard</Link>
            </Button>
        </CardContent>
    </Card>

}