import Sidebar from "./Sidebar.jsx";
import {elections, navigationItems, systemHealth} from "../../data/dashboardData.js";
import DashboardHeader from "../dashboard/DashboardHeader.jsx";
import ElectionCard from "../dashboard/ElectionCard.jsx";
import HealthPanel from "../dashboard/HealthPanel.jsx";


export default function Layout({children, title}) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-page px-0 text-slate-900">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(45,86,198,0.14),transparent_35%),radial-gradient(circle_at_88%_24%,rgba(15,118,110,0.2),transparent_28%),linear-gradient(180deg,#f4f7fc_0%,#eef2f8_100%)]" />

            <div className="relative mx-auto grid  lg:grid-cols-[280px_minmax(0,1fr)]">
                <div className="hidden lg:block">
                    <Sidebar items={navigationItems} />
                </div>

                <main className="px-4 py-5 sm:px-6 lg:px-8">
                    <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_360px]">
                        <div>
                            <DashboardHeader title={title} />
                            <div className="space-y-5">
                                {children}
                            </div>
                        </div>

                        <HealthPanel systemHealth={systemHealth} />
                    </section>
                </main>
            </div>
        </div>
    );
}