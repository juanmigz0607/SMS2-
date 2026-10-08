import { PageHeader } from "@/components/page-header"

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function HealthRecordPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Health Record Management"
                description="Manage student medical clearance and health records."
            />
        </div>
    )
}
