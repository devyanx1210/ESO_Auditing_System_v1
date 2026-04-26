import { FiEye, FiEyeOff } from "react-icons/fi";

// Shared constants

export const POSITION_SUGGESTIONS: Record<string, string> = {
    system_admin:      "System Administrator",
    eso_officer:       "ESO Officer",
    class_officer:     "Class Officer",
    program_officer:   "Program Officer",
    signatory:         "Signatory",
    class_secretary:   "Class Secretary",
    class_treasurer:   "Class Treasurer",
    class_president:   "Class President",
    program_treasurer: "Program Treasurer",
    program_president: "Program President",
    eso_treasurer:     "ESO Treasurer",
    eso_vpsa:          "ESO Vice President for Student Affairs",
    eso_president:     "ESO President",
    osas_coordinator:  "OSAS Coordinator",
    program_head:      "Program Head",
    dean:              "Dean of Engineering",
    auditor:           "Auditor",
};

export const CLASS_ROLES = [
    "class_officer", "class_secretary", "class_treasurer", "class_president",
];

export const YEAR_LEVELS = [
    { value: "1", label: "1st Year" },
    { value: "2", label: "2nd Year" },
    { value: "3", label: "3rd Year" },
    { value: "4", label: "4th Year" },
    { value: "5", label: "5th Year" },
];

export const BLANK_FORM = {
    firstName: "", lastName: "", email: "", password: "",
    role: "eso_officer", programId: "", position: "",
    yearLevel: "", section: "",
};

export type CreateForm = typeof BLANK_FORM;

// Props

interface Program {
    program_id: number;
    name:       string;
    code:       string;
}

interface Role {
    role_id:    number;
    role_name:  string;
    role_label: string;
}

export interface CreateAccountModalProps {
    form:           CreateForm;
    setForm:        React.Dispatch<React.SetStateAction<CreateForm>>;
    formError:      string;
    saving:         boolean;
    showCreatePass: boolean;
    setShowCreatePass: React.Dispatch<React.SetStateAction<boolean>>;
    programs:       Program[];
    roles:          Role[];
    onSubmit:       (e: React.FormEvent) => void;
    onClose:        () => void;
}

const inputCls = "border-2 border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white";

export default function CreateAccountModal({
    form, setForm, formError, saving,
    showCreatePass, setShowCreatePass,
    programs, roles,
    onSubmit, onClose,
}: CreateAccountModalProps) {
    const isClassOfficer = CLASS_ROLES.includes(form.role);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            style={{ animation: "fadeInScrim 0.2s ease both" }}
            onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
                style={{ animation: "modalPop 0.28s cubic-bezier(.34,1.4,.64,1) both" }}
                onClick={e => e.stopPropagation()}>

                <div className="flex items-center justify-between mb-5 pb-3">
                    <h2 className="font-semibold text-gray-800 text-lg">Create Account</h2>
                    <button onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">&times;</button>
                </div>

                {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                            <input className={inputCls} value={form.firstName}
                                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                                placeholder="Juan" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                            <input className={inputCls} value={form.lastName}
                                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                                placeholder="Dela Cruz" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <input type="email" className={inputCls} value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                placeholder="user@eso.edu.ph" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                            <div className="relative">
                                <input type={showCreatePass ? "text" : "password"} className={inputCls}
                                    value={form.password}
                                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                    placeholder="Min. 8 characters" />
                                <button type="button" onClick={() => setShowCreatePass(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                                    {showCreatePass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                            <select className={inputCls} value={form.role}
                                onChange={e => {
                                    const roleName = e.target.value;
                                    setForm(f => ({
                                        ...f, role: roleName,
                                        programId: "", yearLevel: "", section: "",
                                        position: POSITION_SUGGESTIONS[roleName] ?? "",
                                    }));
                                }}>
                                {roles.filter(r => r.role_name !== "student").map(r => (
                                    <option key={r.role_name} value={r.role_name}>{r.role_label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                            <select className={inputCls} value={form.programId}
                                onChange={e => setForm(f => ({ ...f, programId: e.target.value }))}>
                                <option value="">None</option>
                                {programs.map(p => (
                                    <option key={p.program_id} value={p.program_id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {isClassOfficer && (
                            <div style={{ animation: "fadeInUp 0.2s ease both" }}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Year Level *</label>
                                <select className={inputCls} value={form.yearLevel}
                                    onChange={e => setForm(f => ({ ...f, yearLevel: e.target.value }))}>
                                    <option value="" disabled hidden>Select year level</option>
                                    {YEAR_LEVELS.map(y => (
                                        <option key={y.value} value={y.value}>{y.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {isClassOfficer && (
                            <div style={{ animation: "fadeInUp 0.2s ease both 0.05s" }}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                                <input className={inputCls} value={form.section}
                                    onChange={e => setForm(f => ({ ...f, section: e.target.value }))}
                                    placeholder="e.g. A, B, Section 1" />
                            </div>
                        )}

                        {form.role !== "system_admin" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                                <input list="position-suggestions" className={inputCls}
                                    value={form.position}
                                    onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                                    placeholder="e.g. ESO President" />
                                <datalist id="position-suggestions">
                                    {Object.values(POSITION_SUGGESTIONS).map(p => (
                                        <option key={p} value={p} />
                                    ))}
                                </datalist>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between pt-2">
                        <button type="button"
                            onClick={() => setForm(BLANK_FORM)}
                            className="px-6 py-2.5 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition text-sm">
                            Reset
                        </button>
                        <button type="submit" disabled={saving}
                            className="px-6 py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition disabled:opacity-60 text-sm">
                            {saving ? "Creating..." : "Create Account"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
