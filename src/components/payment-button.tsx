'use client'

import { loadStripe } from "@stripe/stripe-js";
import { Button } from "./ui/button";
import { useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog"
import { VisuallyHidden } from "radix-ui";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";

type PaymentButtonProps = {
    children: React.ReactNode;
}

export default function PaymentButton({ children }: PaymentButtonProps) {

    const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

    const fetchClientSecret = useCallback(async () => {
        return fetch("/api/checkout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({})
        })
            .then(res => res.json())
            .then((data) => data.client_secret)
    }, []);

    const options = { fetchClientSecret };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="w-full">{children}</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <>
                        <VisuallyHidden.Root>
                            <DialogTitle>Tudo que você precisa para seus estudos - Assinatura Pro</DialogTitle>
                        </VisuallyHidden.Root>
                        <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
                            <EmbeddedCheckout />
                        </EmbeddedCheckoutProvider>
                    </>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}