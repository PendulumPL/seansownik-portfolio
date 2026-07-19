import React from "react";
import { SvgUri } from "react-native-svg";

const OFFICIAL_TMDB_LOGO = "https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg";

// Official TMDB "Alt short (blue)" logo from:
// https://www.themoviedb.org/about/logos-attribution
export default function TmdbLogo({ width = 150 }) {
  return <SvgUri width={width} height={Math.round(width * 0.2)} uri={OFFICIAL_TMDB_LOGO} />;
}