import Link from "next/link";
import CodeBlock from "@/app/components/developers/CodeBlock";
import ApiExample from "@/app/components/developers/ApiExample";

export default function DevelopersPage() {
  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
          Developers
        </h1>
        <p className="text-xl text-base-content/70 mb-12">
          Build integrations and custom clients with the Screenie API
        </p>

        {/* Introduction */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Introduction</h2>
          <p className="text-base-content/80 mb-4">
            Screenie provides a fully-featured REST API for building client timer apps, 
            accessing family screen time allowances, and integrating with external systems. 
            Whether you&apos;re building a dedicated device, a mobile app, or connecting 
            Screenie to your smart home setup, our API has you covered.
          </p>
          
          <div className="bg-base-200 p-6 rounded-lg mt-6">
            <h3 className="font-semibold text-lg mb-3">Example Use Cases</h3>
            <ul className="list-disc list-inside space-y-2 text-base-content/80">
              <li>Build a tiny timer that displays remaining screen time</li>
              <li>Create a smartwatch or phone app that tracks screen time</li>
              <li>Update an external display (e.g. e-ink screen, LED matrix) with current screen time allowances</li>
              <li>Integrate with third-party screen time providers or parental control systems</li>
              <li>Connect to smart home platforms — for example, automatically disable internet access when screen time has run out</li>
              <li>Build custom dashboards or reporting tools for screen time analytics</li>
            </ul>
          </div>
        </section>

        {/* Authentication - Parent Access Role */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Authentication</h2>
          
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4">Parent Access Role (API Key)</h3>
            <p className="text-base-content/80 mb-4">
              To access admin-related functions — such as reading and writing screen time allowances, 
              accepting bonus time requests, and managing family members — you&apos;ll need to obtain 
              an API key.
            </p>
            <p className="text-base-content/80 mb-4">
              API keys can be generated from your{" "}
              <Link href="/home/settings" className="link link-primary">
                Settings page
              </Link>
              . Once you have your key, include it in the request header:
            </p>
            
            <CodeBlock
              code="X-API-Key: your-api-key-here"
              language="header"
            />
            
            <div className="alert alert-warning mt-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Keep your API key secure. Never expose it in client-side code or public repositories.</span>
            </div>
          </div>
        </section>

        {/* Device Pairing Process */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Device Pairing Process</h2>
          <h3 className="text-2xl font-semibold mb-4">Child Access Role (Device Token)</h3>
          
          <p className="text-base-content/80 mb-4">
            For headless devices like timers, smart TV apps, or IoT displays, Screenie provides 
            an automated pairing flow. This allows a device to obtain an API token without requiring 
            direct user login on the device itself — instead, a parent authorizes the device by 
            scanning a QR code or entering a pairing code on their phone or computer.
          </p>

          <div className="divider"></div>

          <h4 className="text-xl font-semibold mb-4">Step-by-Step Pairing Flow</h4>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h5 className="font-semibold mb-2">Device Requests a Pairing Code</h5>
                <p className="text-base-content/80 mb-3">
                  The device calls the pairing endpoint to obtain a unique code:
                </p>
                <CodeBlock
                  code={`GET /api/pairing/devicecode?deviceName=Living%20Room%20Timer

Response:
{
  "pairingCode": "ABC123",
  "expiresAt": "2026-01-04T15:30:00.000Z",
  "pollInterval": 5
}`}
                  language="http"
                />
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h5 className="font-semibold mb-2">Device Displays the Code</h5>
                <p className="text-base-content/80 mb-3">
                  The device then displays the pairing code to the user. You have two options:
                </p>
                <div className="bg-base-200 p-4 rounded-lg space-y-3">
                  <div>
                    <strong>Option A: QR Code</strong>
                    <p className="text-base-content/70 text-sm">
                      Generate a QR code that links directly to the pairing page with the code embedded:
                    </p>
                    <CodeBlock code="https://screenie.org/home/pair?code=ABC123" language="url" />
                  </div>
                  <div>
                    <strong>Option B: Manual Entry</strong>
                    <p className="text-base-content/70 text-sm">
                      Display the code on screen along with instructions for the user to visit{" "}
                      <code className="bg-base-300 px-1 rounded">https://screenie.org/home/pair</code>{" "}
                      and enter the code manually.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <h5 className="font-semibold mb-2">Parent Authorizes the Device</h5>
                <p className="text-base-content/80">
                  The parent scans the QR code or visits the pairing page and enters the code. 
                  They&apos;ll be prompted to log in (if not already) and then confirm the pairing.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold">
                4
              </div>
              <div className="flex-1">
                <h5 className="font-semibold mb-2">Device Polls for Completion</h5>
                <p className="text-base-content/80 mb-3">
                  While waiting for authorization, the device should poll at the recommended 
                  interval (returned in the initial response) to check if pairing is complete:
                </p>
                <CodeBlock
                  code={`GET /api/pairing/devicecode/status?code=ABC123

// When still waiting:
{ "status": "pending" }

// When authorized:
{
  "status": "linked",
  "apiKey": "device-api-key-xxxxx",
  "familyGroupId": "abc123...",
  "childId": "def456..."
}`}
                  language="http"
                />
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold">
                5
              </div>
              <div className="flex-1">
                <h5 className="font-semibold mb-2">Device Stores Credentials</h5>
                <p className="text-base-content/80">
                  Once the API key is received, the device should securely store it for future 
                  API calls. The device can now access screen time data for the linked family 
                  using the <code className="bg-base-300 px-1 rounded">X-API-Key</code> header.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Getting Started */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Getting Started</h2>
          
          <div className="bg-base-200 p-6 rounded-lg mb-8">
            <h3 className="font-semibold text-lg mb-2">API Base URL</h3>
            <CodeBlock code="https://screenie.org/api" language="url" />
            <p className="text-base-content/70 text-sm mt-3">
              All API responses are returned in JSON format. Standard HTTP status codes 
              indicate success (2xx) or failure (4xx, 5xx).
            </p>
          </div>

          <h3 className="text-2xl font-semibold mb-6">Example API Calls</h3>

          <ApiExample
            title="Get User&apos;s Family Groups"
            description="Retrieve all family groups where the authenticated user is a parent."
            endpoint="/api/family"
            method="GET"
            curlCode={`curl -X GET "https://screenie.org/api/family" \\
  -H "X-API-Key: your-api-key-here"`}
            nodeCode={`const response = await fetch("https://screenie.org/api/family", {
  method: "GET",
  headers: {
    "X-API-Key": "your-api-key-here"
  }
});

const data = await response.json();
console.log(data.familyGroups);`}
          />

          <ApiExample
            title="Get Family Members"
            description="Retrieve all members of a specific family group, including children and their details."
            endpoint="/api/family/{familyGroupId}"
            method="GET"
            curlCode={`curl -X GET "https://screenie.org/api/family/abc123" \\
  -H "X-API-Key: your-api-key-here"`}
            nodeCode={`const familyGroupId = "abc123";

const response = await fetch(\`https://screenie.org/api/family/\${familyGroupId}\`, {
  method: "GET",
  headers: {
    "X-API-Key": "your-api-key-here"
  }
});

const data = await response.json();
console.log(data.familyGroup);
console.log(data.members);`}
          />

          <ApiExample
            title="Get Child&apos;s Screen Time Allowance"
            description="Retrieve the base screen time allowance settings for a specific child."
            endpoint="/api/family/{familyGroupId}/child/{childId}/screentime/allowances"
            method="GET"
            curlCode={`curl -X GET "https://screenie.org/api/family/abc123/child/def456/screentime/allowances" \\
  -H "X-API-Key: your-api-key-here"`}
            nodeCode={`const familyGroupId = "abc123";
const childId = "def456";

const response = await fetch(
  \`https://screenie.org/api/family/\${familyGroupId}/child/\${childId}/screentime/allowances\`,
  {
    method: "GET",
    headers: {
      "X-API-Key": "your-api-key-here"
    }
  }
);

const data = await response.json();
console.log(data.allowance);`}
          />

          <ApiExample
            title="Get Effective Allowance for Today"
            description="Get the calculated screen time for a specific date, including any bonus time grants."
            endpoint="/api/family/{familyGroupId}/child/{childId}/screentime/on-date/today"
            method="GET"
            curlCode={`curl -X GET "https://screenie.org/api/family/abc123/child/def456/screentime/on-date/today?includegrants=true" \\
  -H "X-API-Key: your-api-key-here"`}
            nodeCode={`const familyGroupId = "abc123";
const childId = "def456";

const response = await fetch(
  \`https://screenie.org/api/family/\${familyGroupId}/child/\${childId}/screentime/on-date/today?includegrants=true\`,
  {
    method: "GET",
    headers: {
      "X-API-Key": "your-api-key-here"
    }
  }
);

const data = await response.json();
console.log(\`Effective minutes: \${data.effectiveAllowedMinutes}\`);
console.log(\`Wake time: \${data.effectiveWakeUpTime}\`);
console.log(\`Bed time: \${data.effectiveBedTime}\`);`}
          />

          <ApiExample
            title="Grant Bonus Screen Time"
            description="Add bonus minutes to a child's screen time for a specific date."
            endpoint="/api/family/{familyGroupId}/child/{childId}/grant"
            method="POST"
            curlCode={`curl -X POST "https://screenie.org/api/family/abc123/child/def456/grant" \\
  -H "X-API-Key: your-api-key-here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "applicableDate": "today",
    "bonusMinutes": 30,
    "notes": "Great homework completion!"
  }'`}
            nodeCode={`const familyGroupId = "abc123";
const childId = "def456";

const response = await fetch(
  \`https://screenie.org/api/family/\${familyGroupId}/child/\${childId}/grant\`,
  {
    method: "POST",
    headers: {
      "X-API-Key": "your-api-key-here",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      applicableDate: "today",
      bonusMinutes: 30,
      notes: "Great homework completion!"
    })
  }
);

const data = await response.json();
console.log("Grant created:", data);`}
          />

          <ApiExample
            title="Record a Screen Time Session"
            description="Log consumed screen time by recording a session with start time and duration."
            endpoint="/api/family/{familyGroupId}/child/{childId}/session"
            method="POST"
            curlCode={`curl -X POST "https://screenie.org/api/family/abc123/child/def456/session" \\
  -H "X-API-Key: your-api-key-here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "startedAt": "2026-01-04T14:00:00.000Z",
    "duration": 45
  }'`}
            nodeCode={`const familyGroupId = "abc123";
const childId = "def456";

const response = await fetch(
  \`https://screenie.org/api/family/\${familyGroupId}/child/\${childId}/session\`,
  {
    method: "POST",
    headers: {
      "X-API-Key": "your-api-key-here",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      startedAt: new Date().toISOString(),
      duration: 45 // minutes
    })
  }
);

const data = await response.json();
console.log("Session recorded:", data);`}
          />
        </section>

        {/* Further Reference */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Further Reference</h2>
          <p className="text-base-content/80 mb-4">
            For a complete guide to all available endpoints, request/response schemas, 
            and advanced features, check out the full API documentation.
          </p>
          
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title">API Documentation</h3>
              <p className="text-base-content/70">
                Comprehensive reference for all Screenie API endpoints.
              </p>
              <div className="card-actions justify-end mt-4">
                <button className="btn btn-primary btn-disabled">
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Support */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Need Help?</h2>
          <p className="text-base-content/80 mb-4">
            If you have questions about the API or need assistance with your integration, 
            we&apos;re here to help.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link href="/about" className="btn btn-outline">
              Learn More About Screenie
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
