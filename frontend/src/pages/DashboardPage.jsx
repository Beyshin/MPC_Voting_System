import DashboardHeader from "../components/dashboard/DashboardHeader";
import ElectionCard from "../components/dashboard/ElectionCard";
import HealthPanel from "../components/dashboard/HealthPanel";
import Sidebar from "../components/layout/Sidebar";
import {
  elections,
  navigationItems,
  systemHealth,
} from "../data/dashboardData";
import Layout from "../components/layout/Layout.jsx";

export default function DashboardPage() {
    return(
        <Layout title="Aktywne glosowania">
          {elections.map((election) => (
              <ElectionCard key={election.id} election={election} />
          ))}
        </Layout>
    )
}
