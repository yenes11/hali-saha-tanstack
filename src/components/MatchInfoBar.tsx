import { useEffect, useState } from 'react'
import { Clock, MapPin, ExternalLink, Pencil, Check, X } from 'lucide-react'
import { getMatchInfo, updateMatchInfo, type MatchInfo } from '../lib/matchInfo'

const HOURS = Array.from({ length: 17 }, (_, i) => i + 7) // 07:00 - 23:00

const EMPTY_INFO: MatchInfo = {
  startHour: null,
  locationUrl: null,
}

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

function formatRange(startHour: number) {
  const endHour = (startHour + 1) % 24
  return `${pad(startHour)}:00 - ${pad(endHour)}:00`
}

export default function MatchInfoBar() {
  const [info, setInfo] = useState<MatchInfo>(EMPTY_INFO)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<MatchInfo>(EMPTY_INFO)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getMatchInfo()
      .then((data) => {
        setInfo(data)
        setDraft(data)
      })
      .catch((e) => console.error('Maç bilgisi alınırken hata:', e))
      .finally(() => setLoading(false))
  }, [])

  const startEditing = () => {
    setDraft(info)
    setEditing(true)
  }

  const cancelEditing = () => {
    setDraft(info)
    setEditing(false)
  }

  const save = async () => {
    setSaving(true)
    try {
      await updateMatchInfo({ data: draft })
      setInfo(draft)
      setEditing(false)
    } catch (e) {
      console.error('Maç bilgisi kaydedilirken hata:', e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  if (editing) {
    return (
      <div className="mx-auto mb-6 max-w-md rounded-2xl border border-border bg-card px-4 py-4">
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-text-muted">
            Saat
          </label>
          <select
            value={draft.startHour ?? ''}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                startHour: e.target.value === '' ? null : Number(e.target.value),
              }))
            }
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
          >
            <option value="">Seçilmedi</option>
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {formatRange(h)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">
            Google Maps linki
          </label>
          <input
            type="url"
            value={draft.locationUrl ?? ''}
            onChange={(e) =>
              setDraft((d) => ({ ...d, locationUrl: e.target.value || null }))
            }
            placeholder="https://maps.google.com/..."
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={cancelEditing}
            disabled={saving}
            className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-text-muted transition hover:text-text disabled:opacity-50"
          >
            <X size={14} />
            İptal
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1 rounded-xl bg-neutral-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-500 disabled:opacity-40"
          >
            <Check size={14} />
            Kaydet
          </button>
        </div>
      </div>
    )
  }

  const hasTime = info.startHour !== null
  const hasLocation = !!info.locationUrl

  if (!hasTime && !hasLocation) {
    return (
      <div className="mx-auto mb-6 max-w-md">
        <button
          type="button"
          onClick={startEditing}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-2.5 text-sm text-text-muted transition hover:border-border-hover hover:text-text"
        >
          <Clock size={16} />
          Saat ve konum ekle
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto mb-6 flex max-w-md flex-wrap items-center justify-center gap-2">
      {hasTime && (
        <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-text">
          <Clock size={14} className="text-text-muted" />
          {formatRange(info.startHour as number)}
        </span>
      )}
      {hasLocation && (
        <a
          href={info.locationUrl as string}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-text transition hover:border-border-hover hover:bg-card-hover"
        >
          <MapPin size={14} className="text-text-muted" />
          Konum
          <ExternalLink size={12} className="text-text-muted" />
        </a>
      )}
      <button
        type="button"
        onClick={startEditing}
        className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-sm text-text-muted transition hover:border-border-hover hover:text-text"
      >
        <Pencil size={12} />
        Düzenle
      </button>
    </div>
  )
}
