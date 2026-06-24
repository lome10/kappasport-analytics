import DateRangePicker from './DateRangePicker'
import PlayerSelect from './PlayerSelect'
import CategoryToggle from './CategoryToggle'
import SessionTypeToggle from './SessionTypeToggle'

export default function FilterBar() {
  return (
    <div className="border-b border-border bg-muted/20 px-4 py-2">
      <div className="flex items-center gap-4 overflow-x-auto">
        <DateRangePicker />
        <div className="h-4 w-px bg-border shrink-0" />
        <PlayerSelect />
        <div className="h-4 w-px bg-border shrink-0" />
        <CategoryToggle />
        <SessionTypeToggle />
      </div>
    </div>
  )
}
