// Tymczasowy wrapper — docelowo App.jsx zostanie rozbity na komponenty
// w Etapie 4. Na razie importujemy App jako DashboardContent.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error — App.jsx nie ma jeszcze typów (migracja w toku)
import AppContent from '../AppContent'

export function DashboardPage() {
  return <AppContent />
}
