import { FiEye, FiEyeOff } from "react-icons/fi";
import { POSITION_SUGGESTIONS, CLASS_ROLES, YEAR_LEVELS } from "./CreateAccountModal";

// Types

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

export interface Account {
    user_id:      number;
    first_name:   string;
    last_name:    string;
    email:        string;
    role_id:      number;
    role_name:    string;
    role_label:   string;
    program_id:   number | null;
    program_name: string | null;
    position:     string | null;
    year_level:   number | null;
    section:      string | null;
    avatar_path:  string | null;
    status:       string;
}

export type EditForm = {
    firstName: string;
    lastName:  string;
    email:     string;
    roleId:    string;
    programId: string;
    position:  string;
    password:  string;
    yearLevel: string;
    section:   string;
};

export interface EditAccountModalProps {
    editTarget:   Account;
    editForm:     EditForm;
    setEditForm:  React.Dispatch<React.SetStateAction<EditForm>>;
    editError:    string;
    editSaving:   boolean;
    showEditPass: boolean;
    setShowEditPass: React.Dispatch<React.SetStateAction<boolean>>;
    programs:     Program[];
    roles:        Role[];
    onSubmit:     (e: React.FormEvent) => void;
    onClose:      () => void;
}

const inputCls = "border-2 border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white";

export default function EditAccountModal({
    editTarget, editForm, setEditForm, editError, editSaving,
    showEditPass, setShowEditPass,
    programs, roles,
    onSubmit, onClose,
}: EditAccountModalProps) {
    const currentRoleName = roles.find(r => r.role_id === Number(editForm.roleId))?.role_name ?? "";
    const isClassRole     = CLASS_ROLES.includes(currentRoleName);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => { if (!editSaving) onClose(); }}
            style={{ animation: "fadeInScrim 0.2s ease both" }}>
            <div className="bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
                onClick={e => e.stopPropagation()}
                style={{ animation: "modalPop 0.28s cubic-bezier(.34,1.4,.64,1) both" }}>

                <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-800 text-lg">Edit Account</h2>
                    <button onClick={onClose} disabled={editSaving}
                        className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">&times;</button>
                </div>

                {editError && <p className="text-red-500 text-sm mb-4">{editError}</p>}

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                            <input className={inputCls} value={editForm.firstName}
                                onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                            <input className={inputCls} value={editForm.lastName}
                                onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <input type="email" className={inputCls} value={editForm.email}
                                onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                            <select className={inputCls} value={editForm.roleId}
                                onChange={e => {
                                    const rid      = e.target.value;
                                    const roleName = roles.find(r => r.role_id === Number(rid))?.role_name ?? "";
                                    setEditForm(f => ({
                                        ...f, roleId: rid, programId: "",
                                        position: POSITION_SUGGESTIONS[roleName] ?? f.position,
                                    }));
                                }}
                                disabled={editTarget.role_name === "system_admin"}>
                                {editTarget.role_name === "system_admin" && (
                                    <option value={editForm.roleId}>System Admin</option>
                                )}
                                {roles
                                    .filter(r => r.role_name !== "student" && r.role_name !== "system_admin")
                                    .map(r => (
                                        <option key={r.role_id} value={r.role_id}>{r.role_label}</option>
                                    ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                            <select className={inputCls} value={editForm.programId}
                                onChange={e => setEditForm(f => ({ ...f, programId: e.target.value }))}>
                                <option value="">— none —</option>
                                {programs.map(p => (
                                    <option key={p.program_id} value={p.program_id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {editTarget.role_name !== "system_admin" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                                <input list="edit-position-suggestions" className={inputCls}
                                    value={editForm.position}
                                    onChange={e => setEditForm(f => ({ ...f, position: e.target.value }))}
                                    placeholder="e.g. ESO Director" />
                                <datalist id="edit-position-suggestions">
                                    {Object.values(POSITION_SUGGESTIONS).map(p => (
                                        <option key={p} value={p} />
                                    ))}
                                </datalist>
                            </div>
                        )}

                        {isClassRole && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Year Level *</label>
                                <select className={inputCls} value={editForm.yearLevel}
                                    onChange={e => setEditForm(f => ({ ...f, yearLevel: e.target.value }))}>
                                    <option value="" disabled hidden>Select year level</option>
                                    {YEAR_LEVELS.map(y => (
                                        <option key={y.value} value={y.value}>{y.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {isClassRole && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                                <input className={inputCls} value={editForm.section}
                                    onChange={e => setEditForm(f => ({ ...f, section: e.target.value }))}
                                    placeholder="e.g. A, B, Section 1" />
                            </div>
                        )}

                        <div className="sm:col-span-2 lg:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                New Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
                            </label>
                            <div className="relative">
                                <input type={showEditPass ? "text" : "password"} className={inputCls}
                                    value={editForm.password}
                                    onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                                    placeholder="Min. 8 characters" />
                                <button type="button" onClick={() => setShowEditPass(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                                    {showEditPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                        <button type="button" onClick={onClose} disabled={editSaving}
                            className="px-5 py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={editSaving}
                            className="px-5 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition disabled:opacity-50 flex items-center gap-2">
                            {editSaving
                                ? <><div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />Saving...</>
                                : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
