import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Personal OS | Hamzeh",
    description: "Private Dashboard",
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
