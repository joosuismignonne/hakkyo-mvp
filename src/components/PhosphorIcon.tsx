import type { Icon } from '@phosphor-icons/react'
import {
  ChatCircle, Globe, House, Briefcase, Calendar, Star, Megaphone,
  Handshake, Bell, Books, Cat, MagnifyingGlass, Heart, ThumbsUp,
  PushPin, Confetti, CurrencyDollar, CheckCircle, Warning, Fire,
  Target, Trophy, Note, MapPin, Users, Pencil, ArrowLeft,
  HandWaving, Hash, Sparkle, Chat,
} from '@phosphor-icons/react'

// Map emoji string → Phosphor component
const EMOJI_MAP: Record<string, Icon> = {
  '💬': ChatCircle,
  '🌐': Globe,
  '🏠': House,
  '💼': Briefcase,
  '📅': Calendar,
  '⭐': Star,
  '📢': Megaphone,
  '🤝': Handshake,
  '🔔': Bell,
  '📚': Books,
  '🐱': Cat,
  '😺': Cat,
  '🔍': MagnifyingGlass,
  '❤️': Heart,
  '👍': ThumbsUp,
  '📌': PushPin,
  '🎉': Confetti,
  '💰': CurrencyDollar,
  '✅': CheckCircle,
  '⚠️': Warning,
  '🔥': Fire,
  '🎯': Target,
  '🏆': Trophy,
  '📝': Note,
  '🗓': Calendar,
  '🗺': MapPin,
  '👥': Users,
  '✏️': Pencil,
  '←': ArrowLeft,
  '✋': HandWaving,
  '#': Hash,
  '✨': Sparkle,
  '🗨': Chat,
}

interface Props {
  emoji: string
  size?: number
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
  className?: string
}

export default function PhosphorIcon({ emoji, size = 18, weight = 'bold', className }: Props) {
  const Ic = EMOJI_MAP[emoji]
  if (!Ic) return <span>{emoji}</span>
  return <Ic size={size} weight={weight} className={className} />
}

export { EMOJI_MAP }
