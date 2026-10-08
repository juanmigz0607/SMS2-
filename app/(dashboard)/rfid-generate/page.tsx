import { PageHeader } from "@/components/page-header"

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function RfidGeneratePage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Student RFID Generate"
                description="Generate and issue student RFID credentials and cards."
            />
        </div>
    )
}
