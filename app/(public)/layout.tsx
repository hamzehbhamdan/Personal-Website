import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BackToTop } from "@/components/back-to-top";
import { PageTransition } from "@/components/page-transition";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <SiteHeader />
            <PageTransition>
                <div className="flex-1">
                    {children}
                </div>
            </PageTransition>
            <SiteFooter />
            <BackToTop />
        </>
    );
}
