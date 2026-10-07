/** Identifiant anonyme, stable pour l'onglet : pas d'auth, mais une mémoire qui tient. */
export function getStudentId(): string {
  if (typeof window === "undefined") return "demo-student";
  let id = window.sessionStorage.getItem("student_id");
  if (!id) {
    id = `etu-${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem("student_id", id);
  }
  return id;
}
