import { useState } from "react";
import { useHouseholdContext } from "../contexts/HouseholdContext.jsx";
import { PendingInvitationsCard } from "../components/account/PendingInvitationsCard.jsx";
import { ProfileSection }    from "../components/account/ProfileSection.jsx";
import { CategoriesSection } from "../components/account/CategoriesSection.jsx";
import { HouseholdSection }  from "../components/account/HouseholdSection.jsx";
import { RecurringSection }  from "../components/account/RecurringSection.jsx";

const SECTIONS = [
  { id: "profile",    label: "Profile"    },
  { id: "categories", label: "Categories" },
  { id: "household",  label: "Household"  },
  { id: "recurring",  label: "Recurring"  },
];

export function AccountPage({ user, onChangePassword, onUpdateProfile, onDeleteAccount }) {
  const [section, setSection] = useState("profile");

  const { pendingInvitations, loaded: householdLoaded, acceptInvitation, rejectInvitation, refreshProfile } = useHouseholdContext();

  async function handleAcceptInvitation(invitationId) {
    await acceptInvitation(invitationId);
    await refreshProfile?.();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 sm:pb-6 space-y-6">
      <h1 className="text-2xl font-bold">Account</h1>

      {householdLoaded && (
        <PendingInvitationsCard
          invitations={pendingInvitations}
          onAccept={handleAcceptInvitation}
          onReject={rejectInvitation}
        />
      )}

      <div className="flex gap-1 border-b border-gray-100 dark:border-neutral-800 overflow-x-auto">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors shrink-0 ${
              section === s.id
                ? "border-brand-green text-brand-green"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === "profile"    && (
        <ProfileSection
          user={user}
          onUpdateProfile={onUpdateProfile}
          onChangePassword={onChangePassword}
          onDeleteAccount={onDeleteAccount}
        />
      )}
      {section === "categories" && <CategoriesSection />}
      {section === "household"  && <HouseholdSection user={user} onUpdateProfile={onUpdateProfile} />}
      {section === "recurring"  && <RecurringSection user={user} />}
    </div>
  );
}
