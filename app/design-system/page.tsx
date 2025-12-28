"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Input,
  Modal,
  Badge,
  StatusBadge,
  CreditBadge,
  Progress,
  StepProgress,
  CircularProgress,
  Skeleton,
  SkeletonCard,
  EmptyState,
} from "@/components/ui";

export default function DesignSystemPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const steps = [
    { id: "avatar", label: "Avatar" },
    { id: "product", label: "Product" },
    { id: "settings", label: "Settings" },
    { id: "generate", label: "Generate" },
  ];

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container-default">
        <div className="text-center mb-16">
          <h1 className="text-display-md text-gradient mb-4">Design System</h1>
          <p className="text-body-lg text-secondary-500">
            AI Fashion Avatar Platform UI Components
          </p>
        </div>

        {/* Colors */}
        <section className="mb-16">
          <h2 className="text-heading-lg mb-6">Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <ColorSwatch name="Primary" color="bg-primary-600" />
            <ColorSwatch name="Primary Light" color="bg-primary-100" />
            <ColorSwatch name="Secondary" color="bg-secondary-600" />
            <ColorSwatch name="Accent" color="bg-accent-500" />
            <ColorSwatch name="Success" color="bg-success-500" />
            <ColorSwatch name="Error" color="bg-error-500" />
          </div>
        </section>

        {/* Typography */}
        <section className="mb-16">
          <h2 className="text-heading-lg mb-6">Typography</h2>
          <Card>
            <CardContent>
              <div className="space-y-4">
                <p className="text-display-lg">Display Large</p>
                <p className="text-display-md">Display Medium</p>
                <p className="text-display-sm">Display Small</p>
                <p className="text-heading-lg">Heading Large</p>
                <p className="text-heading-md">Heading Medium</p>
                <p className="text-heading-sm">Heading Small</p>
                <p className="text-body-lg">Body Large - For important text and descriptions</p>
                <p className="text-body-md">Body Medium - For regular content and paragraphs</p>
                <p className="text-body-sm text-secondary-500">Body Small - For secondary information</p>
                <p className="text-caption text-secondary-400">Caption - For labels and metadata</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Buttons */}
        <section className="mb-16">
          <h2 className="text-heading-lg mb-6">Buttons</h2>
          <Card>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <p className="text-body-sm text-secondary-500 mb-3">Variants</p>
                  <div className="flex flex-wrap gap-4">
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="accent">Accent</Button>
                    <Button variant="danger">Danger</Button>
                  </div>
                </div>
                <div>
                  <p className="text-body-sm text-secondary-500 mb-3">Sizes</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button variant="primary" size="sm">Small</Button>
                    <Button variant="primary" size="md">Medium</Button>
                    <Button variant="primary" size="lg">Large</Button>
                  </div>
                </div>
                <div>
                  <p className="text-body-sm text-secondary-500 mb-3">States</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button variant="primary" isLoading>Loading</Button>
                    <Button variant="primary" disabled>Disabled</Button>
                    <Button variant="primary" fullWidth>Full Width</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Inputs */}
        <section className="mb-16">
          <h2 className="text-heading-lg mb-6">Inputs</h2>
          <Card>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <Input label="Email" placeholder="Enter your email" />
                <Input label="Password" type="password" placeholder="Enter password" />
                <Input label="With Helper" placeholder="Username" helper="Your unique username" />
                <Input label="With Error" placeholder="Email" error="Invalid email format" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Badges */}
        <section className="mb-16">
          <h2 className="text-heading-lg mb-6">Badges</h2>
          <Card>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <p className="text-body-sm text-secondary-500 mb-3">Variants</p>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="primary">Primary</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="accent">Accent</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="error">Error</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-body-sm text-secondary-500 mb-3">Status Badges</p>
                  <div className="flex flex-wrap gap-3">
                    <StatusBadge status="active" />
                    <StatusBadge status="pending" />
                    <StatusBadge status="processing" />
                    <StatusBadge status="completed" />
                    <StatusBadge status="failed" />
                  </div>
                </div>
                <div>
                  <p className="text-body-sm text-secondary-500 mb-3">Credit Badge</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <CreditBadge credits={100} size="sm" />
                    <CreditBadge credits={500} size="md" />
                    <CreditBadge credits={1000} size="lg" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Progress */}
        <section className="mb-16">
          <h2 className="text-heading-lg mb-6">Progress</h2>
          <Card>
            <CardContent>
              <div className="space-y-8">
                <div>
                  <p className="text-body-sm text-secondary-500 mb-3">Linear Progress</p>
                  <div className="space-y-4">
                    <Progress value={25} showLabel label="Processing..." />
                    <Progress value={60} showLabel label="Uploading..." />
                    <Progress value={100} showLabel label="Complete!" />
                  </div>
                </div>
                <div>
                  <p className="text-body-sm text-secondary-500 mb-3">Step Progress</p>
                  <StepProgress steps={steps} currentStep={2} />
                </div>
                <div>
                  <p className="text-body-sm text-secondary-500 mb-3">Circular Progress</p>
                  <div className="flex gap-8">
                    <CircularProgress value={25} size={100} />
                    <CircularProgress value={65} size={100} />
                    <CircularProgress value={100} size={100} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Cards */}
        <section className="mb-16">
          <h2 className="text-heading-lg mb-6">Cards</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card variant="default">
              <CardHeader title="Default Card" subtitle="Basic card style" />
              <CardContent>
                <p className="text-body-sm text-secondary-500">
                  This is a default card with standard styling.
                </p>
              </CardContent>
            </Card>
            <Card variant="hover">
              <CardHeader title="Hover Card" subtitle="Hover to see effect" />
              <CardContent>
                <p className="text-body-sm text-secondary-500">
                  This card has a hover effect with shadow.
                </p>
              </CardContent>
            </Card>
            <Card variant="interactive">
              <CardHeader title="Interactive Card" subtitle="Click me" />
              <CardContent>
                <p className="text-body-sm text-secondary-500">
                  This card is clickable with scale effect.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Skeleton */}
        <section className="mb-16">
          <h2 className="text-heading-lg mb-6">Skeleton Loading</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <SkeletonCard />
            <Card>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Modal */}
        <section className="mb-16">
          <h2 className="text-heading-lg mb-6">Modal</h2>
          <Card>
            <CardContent>
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                Open Modal
              </Button>
              <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Example Modal"
                description="This is a modal dialog example"
              >
                <p className="text-body-md text-secondary-600 mb-6">
                  Modal content goes here. You can add forms, images, or any other content.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                    Confirm
                  </Button>
                </div>
              </Modal>
            </CardContent>
          </Card>
        </section>

        {/* Empty State */}
        <section className="mb-16">
          <h2 className="text-heading-lg mb-6">Empty State</h2>
          <Card>
            <EmptyState
              icon={<BoxIcon className="w-8 h-8" />}
              title="No items found"
              description="Get started by creating your first item."
              action={{
                label: "Create Item",
                onClick: () => alert("Create clicked!"),
              }}
            />
          </Card>
        </section>
      </div>
    </div>
  );
}

function ColorSwatch({ name, color }: { name: string; color: string }) {
  return (
    <div>
      <div className={`${color} h-16 rounded-xl mb-2`} />
      <p className="text-body-sm text-secondary-600">{name}</p>
    </div>
  );
}

function BoxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}
