# About this project
This is a React Typescript project running on next.js 15 with the App Router.
It uses Tailwind CSS for styling and DaisyUI for lightweight components.
It uses MongoDB as the database and Mongoose as the ORM.

# Architecture
The web application is served by next.js and uses the App Router.

# Functionality

# Environment variables
Environment variables are defined via these files:
.env.development (merged in when running in development environment)
.env.production (merged in when running in production environment)


# Code Style Guide
## Components
Do not write long .tsx files such as page.tsx. Instead, break them down into smaller, reusable components stored in separate files. For example, a page may contain a WidgetList component that takes a prop for 'widgets', then within that there may be a Widget component for each individual widget.

Place components in app/components folder

## Data fetching in client-side components
Use the `useSWR` hook and/or the `fetcher` function from `@/app/utils/fetcher`.

## Interface definitions
Prefix parameter names with underscores in interface definitions to ensure they are not flagged by eslint as unused variables.
```
export interface ProviderAdapter {
  normalizeInbound(_body: unknown): Promise;
}
```

## Logging
Use the logger utility from "@/lib/utils/serverLogger" (server side) and "@/lib/utils/clientLogger" (client side) for logging instead of console.log, console.warn, console.error etc.

## Client-side typing
Do NOT redefine interfaces; use as much of the existing inferred types as possible from the models folder

## Imports
When importing files, do NOT use relative imports, you MUST use a namespace scoped import when possible for example:
```
import { chatGroup } from "@/lib/models/ChatGroup";
```

## Layout and styles
Use Tailwind utility classes for styling and layout wherever possible and in preference to inline styling.
For basic components, use DaisyUI components where possible including but not limited to the following examples:

- For links, never directly use the <a> tag, instead import and use the <Link> component from next/link 

- DaisyUI buttons which should be created like this example:
<button className="btn btn-primary">
  Button
</button>

- DaisyUI progress (loading) indicators which should be created like this example:
<div className="loading loading-spinner"></div>

## API route parameters
When defining API endpoints in routes files, use the `params` object asynchronously to access route parameters. For example:
```typescript
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Use the id parameter
}
```

## Typescript
Never use `any` as a type - always use the most specific type possible. 

## Warnings
Ignore any warnings about un-used variables or un-used imports. Only fix warnings that have been introduced by your own code changes.

## Mongoose Schemas and Types
When creating Mongoose schemas, follow this pattern to ensure proper TypeScript typing:

1. Define an explicit interface for the document:
```typescript
import mongoose, { Schema } from "mongoose";
import { USER_STATUSES, UserStatus } from "@/lib/constants/userConstants";

interface IUser {
  name: string;
  email: string;
  status: UserStatus;
}
```

2. Use the interface when creating the schema:
```typescript
const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  status: { type: String, enum: USER_STATUSES, default: "pending" }
});
```

3. Export both the model and a frontend-friendly type that converts `_id` to string:
```typescript
const UserModel: mongoose.Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

// Export type with lowercase name for frontend usage
export type user = IUser & { _id: string };

export default UserModel;
```

4. For string literal constants, define them in `lib/constants/` using this pattern:
```typescript
export const USER_STATUSES = ["pending", "approved", "suspended"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];
```

## SVG Icons
SVG files can be imported directly as React components using SVGR.

### Storing SVGs
Place SVG files in `app/assets/icons/`.

### Preparing SVGs
Remove `height` and `width` attributes from the root `<svg>` element, but retain the `viewBox` attribute. This allows the icon to scale based on its container or Tailwind classes.

### Importing SVGs as React Components
```typescript
import IosShareIcon from '@/app/assets/icons/ios-share.svg'

const Example = () => (
  <IosShareIcon className="w-6 h-6" />
)
```

### Alternative: URL Import
If you need the SVG as a URL (e.g., for `<Image>` or CSS background), use the `?url` suffix:
```typescript
import Image from 'next/image'
import iosShareUrl from '@/app/assets/icons/ios-share.svg?url'

const Example = () => (
  <Image src={iosShareUrl} alt="Share" width={24} height={24} />
)
```

