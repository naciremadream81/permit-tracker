import PackageDetailClient from "./PackageDetailClient";

// generateStaticParams must live in a Server Component file.
// Returns [] because all packages are loaded from Firestore on the client;
// the Firebase Hosting rewrite serves /packages/index.html for any /packages/* hit.
// Returns one sentinel path so the build satisfies output:export's static-params
// requirement. Firebase Hosting rewrites all real /packages/* hits to this shell.
export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function Page() {
  return <PackageDetailClient />;
}
