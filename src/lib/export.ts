import type { Dataset } from '@/types/data'

// ── CSV ──────────────────────────────────────────────────────────────────────

export function downloadCSV(dataset: Dataset, filename = 'kappasport.csv'): void {
  const headers = [
    'Giocatore',
    'Data',
    'Tipo Sessione',
    ...dataset.metrics.map(
      (m) => `${m.label}${m.unit ? ` (${m.unit})` : ''}`
    ),
  ]

  const rows = [...dataset.points]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((p) => {
      const player = dataset.players.find((pl) => pl.id === p.playerId)
      return [
        player?.name ?? p.playerId,
        p.date,
        p.sessionType,
        ...dataset.metrics.map((m) => {
          const v = p.values[m.key]
          return v !== null
            ? v.toLocaleString('it-IT', { maximumFractionDigits: 4 })
            : ''
        }),
      ]
    })

  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const csv = [
    headers.map(esc).join(','),
    ...rows.map((r) => r.map(esc).join(',')),
  ].join('\r\n')

  // BOM for Excel Italian locale
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  triggerDownload(URL.createObjectURL(blob), filename)
}

// ── PNG ───────────────────────────────────────────────────────────────────────

export async function downloadChartPNG(
  container: HTMLElement,
  filename = 'grafico.png'
): Promise<void> {
  const svg = container.querySelector('svg')
  if (!svg) return

  const { width, height } = svg.getBoundingClientRect()
  const svgData = new XMLSerializer().serializeToString(svg)
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = 2
      const canvas = document.createElement('canvas')
      canvas.width = width * scale
      canvas.height = height * scale
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas non supportato')); return }
      ctx.scale(scale, scale)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(svgUrl)
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Export PNG fallito')); return }
        const url = URL.createObjectURL(blob)
        triggerDownload(url, filename)
        URL.revokeObjectURL(url)
        resolve()
      }, 'image/png')
    }
    img.onerror = () => { URL.revokeObjectURL(svgUrl); reject(new Error('SVG non caricabile')) }
    img.src = svgUrl
  })
}

function triggerDownload(url: string, filename: string): void {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
