import { useEffect, useState } from "react";
import { useHouseholdContext } from "../contexts/HouseholdContext.jsx";
import { PendingInvitationsCard } from "../components/account/PendingInvitationsCard.jsx";
import { ProfileSection }   from "../components/account/ProfileSection.jsx";
import { PasswordSection }  from "../components/account/PasswordSection.jsx";
import { SettingsSection }  from "../components/account/SettingsSection.jsx";
import { CategoriesSection } from "../components/account/CategoriesSection.jsx";
import { HouseholdSection } from "../components/account/HouseholdSection.jsx";
import { DangerSection }    from "../components/account/DangerSection.jsx";

const SECTIONS = [
  { id: "profile",    label: "Profile"     },
  { id: "password",   label: "Password"    },
  { id: "settings",   label: "Settings"    },
  { id: "categories", label: "Categories"  },
  { id: "household",  label: "Household"   },
  { id: "danger",     label: "Danger Zone" },
];

export function AccountPage({ user, onChangePassword, onUpdateProfile, onDeleteAccount }) {
  const [section, setSection] = useState("profile");

  // Load pending invitations for the banner that appears on all tabs
  const { pendingInvitations, loaded: householdLoaded, load: loadHousehold, acceptInvitation, rejectInvitation } = useHouseholdContext();
  useEffect(() => { loadHousehold(); }, [loadHousehold]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 sm:pb-6 space-y-6">
      <h1 className="text-2xl font-bold">Account</h1>

      {/* Pending invitations — visible on all tabs */}
      {householdLoaded && (
        <PendingInvitationsCard
          invitations={pendingInvitations}
          onAccept={acceptInvitation}
          onReject={rejectInvitation}
        />
      )}

      {/* Section tabs */}
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

      {section === "profile"    && <ProfileSection    user={user} onUpdateProfile={onUpdateProfile} />}
      {section === "password"   && <PasswordSection   onChangePassword={onChangePassword} />}
      {section === "settings"   && <SettingsSection   user={user} onUpdateProfile={onUpdateProfile} />}
      {section === "categories" && <CategoriesSection />}
      {section === "household"  && <HouseholdSection  user={user} onUpdateProfile={onUpdateProfile} />}
      {section === "danger"     && <DangerSection     onDeleteAccount={onDeleteAccount} />}
    </div>
  );
}
