import type { ComponentType } from 'react';
import type { GlyphProps } from './Glyph';
import * as cat from './category';
import * as fr from './friends';
import * as nav from './nav';
import * as ui from './ui';

export * from './Glyph';
export * from './nav';
export * from './category';
export * from './friends';
export * from './live';
export * from './ui';

/** Glyphs addressable by name, so sample data can say `glyph: 'cafe'`. */
export const GLYPHS = {
  home: nav.HomeGlyph,
  explore: nav.ExploreGlyph,
  city: nav.CityGlyph,
  me: nav.MeGlyph,
  spark: nav.SparkGlyph,
  food: cat.FoodGlyph,
  cafe: cat.CafeGlyph,
  events: cat.EventsGlyph,
  deals: cat.DealsGlyph,
  alert: cat.AlertGlyph,
  movies: cat.MoviesGlyph,
  getaways: cat.GetawaysGlyph,
  groups: cat.GroupsGlyph,
  services: cat.ServicesGlyph,
  transit: cat.TransitGlyph,
  safety: cat.SafetyGlyph,
  report: cat.ReportGlyph,
  music: cat.MusicGlyph,
  market: cat.MarketGlyph,
  mic: cat.MicGlyph,
  heritage: cat.HeritageGlyph,
  pottery: cat.PotteryGlyph,
  sports: cat.SportsGlyph,
  kids: cat.KidsGlyph,
  nature: cat.NatureGlyph,
  shopping: cat.ShoppingGlyph,
  lostfound: cat.LostFoundGlyph,
  give: cat.GiveGlyph,
  question: cat.QuestionGlyph,
  recommend: cat.RecommendGlyph,
  pin: ui.PinGlyph,
  bus: ui.BusGlyph,
  car: ui.CarGlyph,
  auto: ui.AutoGlyph,
  bike: ui.BikeGlyph,
  walk: ui.WalkGlyph,
  parking: ui.ParkingGlyph,
  route: ui.RouteGlyph,
  hospital: ui.HospitalGlyph,
  police: ui.PoliceGlyph,
  fire: ui.FireGlyph,
  ambulance: ui.AmbulanceGlyph,
  woman: ui.WomanGlyph,
  child: ui.ChildGlyph,
  sos: ui.SosGlyph,
  pothole: ui.PotholeGlyph,
  bin: ui.BinGlyph,
  streetlight: ui.StreetlightGlyph,
  drain: ui.DrainGlyph,
  cattle: ui.CattleGlyph,
  tree: ui.TreeGlyph,
  noise: ui.NoiseGlyph,
  footpath: ui.FootpathGlyph,
  bill: ui.BillGlyph,
  gas: ui.GasGlyph,
  property: ui.PropertyGlyph,
  certificate: ui.CertificateGlyph,
  'water-tap': ui.WaterTapGlyph,
  bolt: ui.BoltGlyph,
  library: ui.LibraryGlyph,
  health: ui.VaccineGlyph,
  calendar: ui.CalendarGlyph,
  star: ui.StarGlyph,
  users: ui.UsersGlyph,
  wifi: ui.WifiGlyph,
  shield: ui.ShieldGlyph,
  reel: ui.ReelGlyph,
  news: ui.NewsGlyph,
  cloud: ui.CloudGlyph,
  air: ui.AirGlyph,
  checkin: fr.CheckInGlyph,
  must: fr.MustGlyph,
  good: fr.GoodGlyph,
  skip: fr.SkipGlyph,
  todo: fr.TodoGlyph,
  friends: fr.FriendsGlyph,
  lists: fr.ListsGlyph,
  want: fr.WantGlyph,
} satisfies Record<string, ComponentType<GlyphProps>>;

export type GlyphName = keyof typeof GLYPHS;

export function NamedGlyph({ name, ...p }: GlyphProps & { name: GlyphName }) {
  const G = GLYPHS[name];
  return <G {...p} />;
}
