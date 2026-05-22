import { PageHeader } from "@/components/page-header";
import { StrategicProjectForm } from "@/components/strategic/strategic-project-form";

export default function NewStrategicProjectPage() {
  return (
    <div>
      <PageHeader title="New Project" />
      <StrategicProjectForm />
    </div>
  );
}
