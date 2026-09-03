import { recordSwapEvent, SwapEventPayload } from '@/lib/swap-events'

export function triggerMapSwapBeam(payload: SwapEventPayload) {
  return recordSwapEvent(payload)
}
