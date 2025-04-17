'use client';

import { CheckCircle, Clock, Package, Truck, CheckCheck } from 'lucide-react';

interface DriverOrderProgressProps {
  status: string;
  createdAt: string;
  pickedUpAt?: string;
  inTransitAt?: string;
  deliveredAt?: string;
}

export default function DriverOrderProgress({
  status,
  createdAt,
  pickedUpAt,
  inTransitAt,
  deliveredAt
}: DriverOrderProgressProps) {
  // Define the steps and their completion status
  const steps = [
    {
      id: 'assigned',
      name: 'Assigned',
      icon: Clock,
      description: 'Order assigned to driver',
      date: createdAt ? new Date(createdAt).toLocaleString() : '',
      complete: ['assigned', 'picked_up', 'in_transit', 'delivered'].includes(status),
      current: status === 'assigned' || status === 'pending'
    },
    {
      id: 'picked_up',
      name: 'Picked Up',
      icon: Package,
      description: 'Order picked up from shop',
      date: pickedUpAt ? new Date(pickedUpAt).toLocaleString() : '',
      complete: ['picked_up', 'in_transit', 'delivered'].includes(status),
      current: status === 'picked_up'
    },
    {
      id: 'in_transit',
      name: 'In Transit',
      icon: Truck,
      description: 'Order is on the way',
      date: inTransitAt ? new Date(inTransitAt).toLocaleString() : '',
      complete: ['in_transit', 'delivered'].includes(status),
      current: status === 'in_transit'
    },
    {
      id: 'delivered',
      name: 'Delivered',
      icon: CheckCheck,
      description: 'Order delivered to customer',
      date: deliveredAt ? new Date(deliveredAt).toLocaleString() : '',
      complete: status === 'delivered',
      current: status === 'delivered'
    }
  ];

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {steps.map((step, stepIdx) => (
          <li key={step.id}>
            <div className="relative pb-8">
              {stepIdx !== steps.length - 1 ? (
                <span
                  className={`absolute left-4 top-4 -ml-px h-full w-0.5 ${
                    step.complete ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={`h-8 w-8 rounded-full flex items-center justify-center ring-1 ring-inset ${
                      step.complete
                        ? 'bg-blue-600 ring-blue-600'
                        : step.current
                        ? 'bg-blue-100 ring-blue-600'
                        : 'bg-white ring-gray-300'
                    }`}
                  >
                    <step.icon
                      className={`h-5 w-5 ${
                        step.complete
                          ? 'text-white'
                          : step.current
                          ? 'text-blue-600'
                          : 'text-gray-400'
                      }`}
                      aria-hidden="true"
                    />
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        step.complete || step.current ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {step.name}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                  {step.date && (
                    <div className="whitespace-nowrap text-right text-xs text-gray-500">
                      <time dateTime={step.date}>{step.date}</time>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
