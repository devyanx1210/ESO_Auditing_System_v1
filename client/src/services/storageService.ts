export const storageService = {

    getUserData() {
        const raw = localStorage.getItem("user");
        if (!raw) return null;

        return JSON.parse(raw);
    },

    saveUserData(data: any) {
        localStorage.setItem("user", JSON.stringify(data));
    },

    getCurrentUser() {
        const raw = localStorage.getItem("currentUser");
        if (!raw) return null;

        return JSON.parse(raw);
    },

    updateStudentProfile(studentId: string, profile: any) {

        const userData = this.getUserData();
        if (!userData?.students?.[studentId]) return;

        userData.students[studentId].profile = profile;

        this.saveUserData(userData);
    },

    broadcastObligationToStudents(obligation: any) {

        const userData = this.getUserData();
        if (!userData?.students) return;

        Object.keys(userData.students).forEach(studentId => {

            const student = userData.students[studentId];

            if (!student.obligations) student.obligations = [];
            if (!student.notifications) student.notifications = [];

            const exists = student.obligations.some(
                (o: any) => o.id === obligation.id
            );

            if (!exists) {

                student.obligations.push({
                    ...obligation,
                    studentStatus: "Not Submitted",
                    proof: null
                });

                student.notifications.push({
                    id: Date.now() + Math.random(),
                    obligationId: obligation.id,
                    message: `New obligation: ${obligation.title}`,
                    createdAt: new Date().toLocaleString(),
                    read: false
                });
            }
        });

        this.saveUserData(userData);
    },

    updateAdminObligations(obligations: any[]) {

        const userData = this.getUserData();
        if (!userData) return;

        userData.admin = userData.admin || {};
        userData.admin.obligations = obligations;

        if (userData.students) {

            Object.values(userData.students).forEach((student: any) => {

                // If student has no obligations yet, initialize
                if (!student.obligations) {
                    student.obligations = [];
                }

                // Strategy: Sync by ID
                obligations.forEach((adminOb: any) => {

                    const exists = student.obligations.find(
                        (sOb: any) => sOb.id === adminOb.id
                    );

                    // If student doesn't have it, add cloned version
                    if (!exists) {
                        student.obligations.push({
                            ...adminOb,
                            studentStatus: "Pending", // student-specific field
                            proof: null
                        });
                    }

                });

            });
        }

        this.saveUserData(userData);
    }



};

