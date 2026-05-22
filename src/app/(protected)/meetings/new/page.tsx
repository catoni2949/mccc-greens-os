import { PageHeader } from "@/components/page-header";
import { MeetingForm } from "@/components/meetings/meeting-form";

export default function NewMeetingPage() {
  return (
    <div>
      <PageHeader title="New Meeting" />
      <MeetingForm />
    </div>
  );
}
