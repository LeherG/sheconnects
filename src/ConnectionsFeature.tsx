import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";

export default function ConnectionsFeature() {
  const [activeTab, setActiveTab] = useState("browse");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-purple-900 dark:text-purple-100">Mentor-Mentee Connections</h1>
      
      {!selectedRole ? (
        <RoleSelector onRoleSelect={setSelectedRole} />
      ) : (
        <>
          <div className="mb-6 flex gap-2 border-b-2 border-purple-200 dark:border-purple-800">
            <TabButton
              active={activeTab === "browse"}
              onClick={() => setActiveTab("browse")}
            >
              Browse {selectedRole === "mentor" ? "Mentees" : "Mentors"}
            </TabButton>
            <TabButton
              active={activeTab === "requests"}
              onClick={() => setActiveTab("requests")}
            >
              Requests
            </TabButton>
            <TabButton
              active={activeTab === "connections"}
              onClick={() => setActiveTab("connections")}
            >
              My Connections
            </TabButton>
            <TabButton
              active={activeTab === "profile"}
              onClick={() => setActiveTab("profile")}
            >
              My Profile
            </TabButton>
          </div>

          {activeTab === "browse" && (
            <BrowseUsers lookingFor={selectedRole === "mentor" ? "mentees" : "mentors"} />
          )}
          {activeTab === "requests" && <PendingRequests />}
          {activeTab === "connections" && <MyConnections />}
          {activeTab === "profile" && <ProfileEditor currentRole={selectedRole} />}
        </>
      )}
    </div>
  );
}

function RoleSelector({ onRoleSelect }: { onRoleSelect: (role: string) => void }) {
  const profile = useQuery(api.connections.getMyProfile);
  const upsertProfile = useMutation(api.connections.upsertProfile);

  if (profile === undefined) {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (profile) {
    onRoleSelect(profile.role);
    return null;
  }

  return (
    <div className="max-w-md mx-auto p-8 bg-white dark:bg-purple-900 rounded-xl border border-purple-200 dark:border-purple-800">
      <h2 className="text-2xl font-bold mb-4 text-purple-900 dark:text-purple-100">Choose Your Role</h2>
      <p className="mb-6 text-purple-700 dark:text-purple-300">
        Are you looking to mentor others, find a mentor, or both?
      </p>
      <div className="flex flex-col gap-3">
        <button
          onClick={() => {
            void upsertProfile({ role: "mentor" });
            onRoleSelect("mentor");
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition"
        >
          I want to be a Mentor
        </button>
        <button
          onClick={() => {
            void upsertProfile({ role: "mentee" });
            onRoleSelect("mentee");
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition"
        >
          I'm looking for a Mentor
        </button>
        <button
          onClick={() => {
            void upsertProfile({ role: "both" });
            onRoleSelect("both");
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition"
        >
          Both - I want to mentor and be mentored
        </button>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium transition-colors rounded-t-lg ${
        active
          ? "border-b-2 border-purple-600 text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900"
          : "text-purple-600 dark:text-purple-400 hover:bg-purple-100/50 dark:hover:bg-purple-900/50"
      }`}
    >
      {children}
    </button>
  );
}

function BrowseUsers({ lookingFor }: { lookingFor: "mentors" | "mentees" }) {
  const users = useQuery(api.connections.browseUsers, { lookingFor });
  const sendRequest = useMutation(api.connections.sendConnectionRequest);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  if (users === undefined) {
    return <div className="text-center p-8 text-purple-700 dark:text-purple-300">Loading users...</div>;
  }

  if (users.length === 0) {
    return (
      <div className="text-center p-8 text-purple-600 dark:text-purple-400">
        No {lookingFor} available right now. Check back later!
      </div>
    );
  }

  const handleSendRequest = async (userId: any) => {
    try {
      await sendRequest({ toUserId: userId, message: message || undefined });
      setSendingTo(null);
      setMessage("");
      alert("Connection request sent!");
    } catch (error: any) {
      alert(error.message || "Failed to send request");
    }
  };

  return (
    <div className="grid gap-4">
      {users.map((user) => (
        <div
          key={user.userId}
          className="p-4 bg-white dark:bg-purple-900 rounded-xl border border-purple-200 dark:border-purple-800 hover:shadow-lg transition"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-lg text-purple-900 dark:text-purple-100">{user.email}</h3>
              <span className="text-sm text-purple-600 dark:text-purple-400 capitalize">
                {user.role}
              </span>
            </div>
            {sendingTo === user.userId ? (
              <button
                onClick={() => setSendingTo(null)}
                className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-200"
              >
                Cancel
              </button>
            ) : (
              <button
                onClick={() => setSendingTo(user.userId)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition"
              >
                Connect
              </button>
            )}
          </div>

          {user.bio && (
            <p className="text-sm mb-2 text-purple-800 dark:text-purple-200">
              {user.bio}
            </p>
          )}

          {user.skills && user.skills.length > 0 && (
            <div className="mb-2">
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">
                Skills:{" "}
              </span>
              <span className="text-xs text-purple-800 dark:text-purple-200">
                {user.skills.join(", ")}
              </span>
            </div>
          )}

          {user.interests && user.interests.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">
                Interests:{" "}
              </span>
              <span className="text-xs text-purple-800 dark:text-purple-200">
                {user.interests.join(", ")}
              </span>
            </div>
          )}

          {sendingTo === user.userId && (
            <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950 rounded-xl border border-purple-200 dark:border-purple-800">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a message (optional)"
                className="w-full p-2 border rounded-lg text-sm mb-2 bg-white dark:bg-purple-900 text-purple-900 dark:text-purple-100 border-purple-300 dark:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
              />
              <button
                onClick={() => handleSendRequest(user.userId)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm w-full transition"
              >
                Send Request
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PendingRequests() {
  const requests = useQuery(api.connections.getPendingRequests);
  const respond = useMutation(api.connections.respondToRequest);

  if (requests === undefined) {
    return <div className="text-center p-8 text-purple-700 dark:text-purple-300">Loading requests...</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="text-center p-8 text-purple-600 dark:text-purple-400">
        No pending requests
      </div>
    );
  }

  const handleRespond = async (requestId: any, accept: boolean) => {
    try {
      await respond({ requestId, accept });
      alert(accept ? "Request accepted!" : "Request rejected");
    } catch (error: any) {
      alert(error.message || "Failed to respond to request");
    }
  };

  return (
    <div className="grid gap-4">
      {requests.map((req) => (
        <div
          key={req.requestId}
          className="p-4 bg-white dark:bg-purple-900 rounded-xl border border-purple-200 dark:border-purple-800"
        >
          <div className="mb-2">
            <h3 className="font-bold text-lg text-purple-900 dark:text-purple-100">{req.fromEmail}</h3>
            <span className="text-sm text-purple-600 dark:text-purple-400 capitalize">
              {req.fromRole}
            </span>
          </div>

          {req.fromBio && (
            <p className="text-sm mb-2 text-purple-800 dark:text-purple-200">
              {req.fromBio}
            </p>
          )}

          {req.message && (
            <div className="p-3 bg-purple-100 dark:bg-purple-950 rounded-lg mb-3 border border-purple-200 dark:border-purple-800">
              <p className="text-sm italic text-purple-800 dark:text-purple-200">
                "{req.message}"
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => handleRespond(req.requestId, true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex-1 transition"
            >
              Accept
            </button>
            <button
              onClick={() => handleRespond(req.requestId, false)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex-1 transition"
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MyConnections() {
  const connections = useQuery(api.connections.getMyConnections);

  if (connections === undefined) {
    return <div className="text-center p-8 text-purple-700 dark:text-purple-300">Loading connections...</div>;
  }

  const { mentors, mentees } = connections;

  return (
    <div className="grid gap-6">
      {mentors.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 text-purple-900 dark:text-purple-100">My Mentors</h2>
          <div className="grid gap-3">
            {mentors.map((mentor) => (
              <ConnectionCard key={mentor.connectionId} user={mentor} />
            ))}
          </div>
        </div>
      )}

      {mentees.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 text-purple-900 dark:text-purple-100">My Mentees</h2>
          <div className="grid gap-3">
            {mentees.map((mentee) => (
              <ConnectionCard key={mentee.connectionId} user={mentee} />
            ))}
          </div>
        </div>
      )}

      {mentors.length === 0 && mentees.length === 0 && (
        <div className="text-center p-8 text-purple-600 dark:text-purple-400">
          No connections yet. Start browsing to find mentors or mentees!
        </div>
      )}
    </div>
  );
}

function ConnectionCard({ user }: { user: any }) {
  return (
    <div className="p-4 bg-white dark:bg-purple-900 rounded-xl border border-purple-200 dark:border-purple-800">
      <h3 className="font-bold text-lg mb-1 text-purple-900 dark:text-purple-100">{user.email}</h3>
      {user.bio && (
        <p className="text-sm text-purple-800 dark:text-purple-200 mb-2">
          {user.bio}
        </p>
      )}
      {user.skills && user.skills.length > 0 && (
        <div className="text-xs text-purple-700 dark:text-purple-300 mb-1">
          <span className="font-semibold">Skills:</span> {user.skills.join(", ")}
        </div>
      )}
      {user.interests && user.interests.length > 0 && (
        <div className="text-xs text-purple-700 dark:text-purple-300">
          <span className="font-semibold">Interests:</span> {user.interests.join(", ")}
        </div>
      )}
    </div>
  );
}

function ProfileEditor({ currentRole }: { currentRole: string }) {
  const profile = useQuery(api.connections.getMyProfile);
  const upsertProfile = useMutation(api.connections.upsertProfile);

  const [role, setRole] = useState(currentRole);
  const [bio, setBio] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [interestsInput, setInterestsInput] = useState("");

  // Initialize form when profile loads
  if (profile && bio === "" && profile.bio) {
    setBio(profile.bio);
    setSkillsInput(profile.skills?.join(", ") || "");
    setInterestsInput(profile.interests?.join(", ") || "");
    setRole(profile.role);
  }

  const handleSave = async () => {
    try {
      await upsertProfile({
        role: role as "mentor" | "mentee" | "both",
        bio: bio || undefined,
        skills: skillsInput
          ? skillsInput.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
        interests: interestsInput
          ? interestsInput.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
      });
      alert("Profile updated!");
    } catch (error: any) {
      alert(error.message || "Failed to update profile");
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6 text-purple-900 dark:text-purple-100">Edit Your Profile</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2 text-purple-900 dark:text-purple-100">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full p-3 border rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-900 dark:text-purple-100 border-purple-300 dark:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="mentor">Mentor</option>
            <option value="mentee">Mentee</option>
            <option value="both">Both</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-purple-900 dark:text-purple-100">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell others about yourself..."
            className="w-full p-3 border rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-900 dark:text-purple-100 border-purple-300 dark:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-purple-900 dark:text-purple-100">
            Skills (comma-separated)
          </label>
          <input
            type="text"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            placeholder="e.g. JavaScript, React, Node.js"
            className="w-full p-3 border rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-900 dark:text-purple-100 border-purple-300 dark:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-purple-900 dark:text-purple-100">
            Interests (comma-separated)
          </label>
          <input
            type="text"
            value={interestsInput}
            onChange={(e) => setInterestsInput(e.target.value)}
            placeholder="e.g. Web Development, AI, Mobile Apps"
            className="w-full p-3 border rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-900 dark:text-purple-100 border-purple-300 dark:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <button
          onClick={handleSave}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl w-full font-semibold transition"
        >
          Save Profile
        </button>
      </div>
    </div>
  );
}