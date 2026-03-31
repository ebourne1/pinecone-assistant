export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50 text-center">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-indigo-900">
          Thank you for using the GLF workers comp AI bot.
        </h1>
        <p className="text-lg text-gray-700">
          This program was made available to attendees of the 2025 GLF seminar.
        </p>
        <p className="text-lg text-gray-700">
          A new and improved version 2 will be made available to attendees of the 2026 GLF seminar (April 30th).
        </p>
        <p className="text-lg text-gray-700">
          For inquiries about signing up for the seminar, and renewing access to this tool, please email{' '}
          <a
            href="mailto:jennifer.jarvis@jext.us"
            className="text-indigo-600 hover:underline"
          >
            elliot@bourne.law
          </a>
        </p>
      </div>
    </main>
  );
}
