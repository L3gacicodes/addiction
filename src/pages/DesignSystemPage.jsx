import { motion } from 'framer-motion'
import { Layout, Heading, Subheading, Card, Button } from '../components/DesignSystem'
import StreakCircle from '../components/StreakCircle'

export default function DesignSystemPage() {
  return (
    <Layout>
      <header className="mb-12">
        <Heading>Design System</Heading>
        <Subheading className="mt-2">Modern Recovery UI</Subheading>
      </header>

      <section className="space-y-12">
        {/* Buttons */}
        <div>
          <Subheading className="mb-6 text-sm">Buttons</Subheading>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary Action</Button>
            <Button variant="secondary">Secondary Action</Button>
            <Button variant="danger">Panic Button</Button>
          </div>
        </div>

        {/* Typography */}
        <div>
          <Subheading className="mb-6 text-sm">Typography</Subheading>
          <div className="space-y-4 bg-backgroundDeep p-8 rounded-2xl border border-slate-800">
            <Heading>Extra Bold Heading</Heading>
            <Subheading>Semi-bold Subheading Muted</Subheading>
            <p className="text-textPrimary">
              Body text using Inter font. Calm and readable. This is the main text color.
            </p>
            <p className="text-textSecondary text-sm italic font-medium">
              Secondary text for smaller, muted details and captions.
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <Subheading className="mb-6 text-sm">Card Component</Subheading>
            <Card title="Supportive Card">
              This is a reusable card component. It has rounded corners, a soft shadow, 
              and a deep background to contrast with the main layout.
            </Card>
          </div>
          <div>
            <Subheading className="mb-6 text-sm">Progress Visual</Subheading>
            <div className="bg-backgroundDeep rounded-2xl p-6 border border-slate-800 flex items-center justify-center h-[180px]">
              <StreakCircle streak={7} maxStreak={30} />
            </div>
          </div>
        </div>

        {/* Layout Spacing Example */}
        <div>
          <Subheading className="mb-6 text-sm">Spacing & Grid</Subheading>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-800/50 h-20 rounded-xl flex items-center justify-center font-bold text-slate-500">
                Gap-4
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mt-20 pt-10 border-t border-slate-800 text-center">
        <p className="text-textSecondary text-xs font-black uppercase tracking-widest">
          Noshake Design System v1.0
        </p>
      </footer>
    </Layout>
  )
}
