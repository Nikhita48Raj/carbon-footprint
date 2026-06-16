import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next-Auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: 'user-123', name: 'Alex Green', email: 'alex@example.com' } },
    status: 'authenticated',
  }),
}));

// Mock Next/Navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/dashboard',
}));

// Mock react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mock-line-chart">Mock Line Chart</div>,
  Doughnut: () => <div data-testid="mock-doughnut-chart">Mock Doughnut Chart</div>,
}));

// Import Zustand Store to seed state if needed
import useStore from '@/store/useStore';

// Import components
import Navigation from '@/components/Navigation';
import DigitalTwin from '@/components/DigitalTwin';
import Dashboard from '@/app/dashboard/page';
import Tracking from '@/app/tracking/page';
import Coach from '@/app/coach/page';
import Goals from '@/app/goals/page';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('EcoTrack React Component & Interaction Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Zustand store to initial state
    useStore.setState({
      dashboardData: null,
      activities: [],
      goals: [],
      toast: null,
    });
  });

  describe('Navigation Component', () => {
    test('renders logo and navigation links for active user', () => {
      render(<Navigation />);
      expect(screen.getByText('EcoTrack')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Track Log')).toBeInTheDocument();
      expect(screen.getByText('Smart Home')).toBeInTheDocument();
      expect(screen.getByText('Digital Twin')).toBeInTheDocument();
    });

    test('parses initials and displays level correctly', () => {
      useStore.setState({
        dashboardData: {
          user: { name: 'Alex Green', gamification: { level: 4 } }
        }
      });
      render(<Navigation />);
      expect(screen.getByText('AG')).toBeInTheDocument();
      expect(screen.getByText('Alex Green')).toBeInTheDocument();
      expect(screen.getByText('Level 4')).toBeInTheDocument();
    });
  });

  describe('DigitalTwin Component', () => {
    test('renders with proper SVG accessibility descriptions', () => {
      render(
        <DigitalTwin 
          co2e={150} 
          energySource="solar" 
          goalsCompleted={2} 
          gridStatus="low" 
          gridIntensity={0.055} 
          gridSource="live" 
        />
      );

      const svg = screen.getByRole('img');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-labelledby', 'twin-svg-title twin-svg-desc');
      expect(screen.getByText('Digital Carbon Twin Illustration')).toBeInTheDocument();
      expect(screen.getByText(/dynamic representation/i)).toBeInTheDocument();
    });

    test('updates twin HUD status indicator based on carbon weight', () => {
      const { rerender } = render(<DigitalTwin co2e={120} />);
      expect(screen.getByText('ECO-HERO 🌱')).toBeInTheDocument();

      rerender(<DigitalTwin co2e={350} />);
      expect(screen.getByText('BALANCED ⚖️')).toBeInTheDocument();

      rerender(<DigitalTwin co2e={600} />);
      expect(screen.getByText('HEAVY LOAD ⚠️')).toBeInTheDocument();
    });
  });

  describe('Dashboard Page', () => {
    test('displays loading spinner initially', () => {
      useStore.setState({ dashboardLoading: true });
      render(<Dashboard />);
      expect(screen.getByText(/loading your carbon data/i)).toBeInTheDocument();
    });

    test('populates charts, streaks, and triggers demo seed reset on click', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'Seeded' }),
      });

      useStore.setState({
        dashboardData: {
          monthlySummary: { transport: 10, energy: 20, food: 30, shopping: 5, waste: 2, total: 67 },
          prevMonthlySummary: { transport: 12, energy: 22, food: 28, shopping: 4, waste: 2, total: 68 },
          monthChange: -1.47,
          trend: [{ label: 'Jan', total: 60 }],
          annualProjection: 800,
          tickRate: 0.000025,
          benchmarks: { world: 4.7, target: 2.0 },
          gridIntensity: 0.2331,
          gridStatus: 'moderate',
          gridSource: 'live',
          user: { name: 'Alex Green', gamification: { level: 2, streakDays: 3, totalPoints: 400, badges: [] } }
        }
      });

      render(<Dashboard />);
      
      expect(screen.getByText('Welcome back, Alex')).toBeInTheDocument();
      expect(screen.getByText(/3 Day Streak/)).toBeInTheDocument();
      expect(screen.getByText('400 pts')).toBeInTheDocument();
      
      const resetBtn = screen.getByRole('button', { name: /reset demo mode/i });
      fireEvent.click(resetBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/demo', { method: 'POST' });
      });
    });
  });

  describe('Tracking Page & Logging Flows', () => {
    test('activity logging flow works correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          activities: []
        }),
      });

      render(<Tracking />);

      // Fill form values
      const amountInput = screen.getByPlaceholderText(/e\.g\./);
      fireEvent.change(amountInput, { target: { value: '45' } });

      const notesInput = screen.getByPlaceholderText(/add context/i);
      fireEvent.change(notesInput, { target: { value: 'Commuted by train' } });

      // Mock POST response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          activity: { _id: 'act-new', category: 'transport', subType: 'car_petrol', amount: 45, unit: 'km', co2e: 7.67, loggedAt: new Date().toISOString() },
          co2e: 7.67
        }),
      });

      const submitBtn = screen.getByRole('button', { name: /calculate & log/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/activities', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            category: 'transport',
            subType: 'car_petrol',
            amount: 45,
            unit: 'km',
            notes: 'Commuted by train'
          })
        }));
      });
    });

    test('computer vision plate scanner and file upload flow works', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          activities: []
        }),
      });

      render(<Tracking />);

      const fileInput = screen.getByLabelText(/upload plate image/i);
      
      // Mock File Upload
      const file = new File(['mock-image-data'], 'plate.png', { type: 'image/png' });

      // Mock plate scan API endpoint returning components list
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          detectedItems: [
            { name: 'Beef steak', weightKg: 0.25, co2e: 6.75, category: 'food', subType: 'beef' }
          ],
          totalCO2e: 6.75
        })
      });

      // Trigger change
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('Beef steak (0.25 kg)')).toBeInTheDocument();
        expect(screen.getByText('6.750 kg CO₂e')).toBeInTheDocument();
      });

      // Mock log calls for approved items
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          activity: { _id: 'act-ocr', category: 'food', subType: 'beef', amount: 0.25, unit: 'kg', co2e: 6.75 }
        })
      });

      const approveBtn = screen.getByRole('button', { name: /approve & log/i });
      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/activities', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            category: 'food',
            subType: 'beef',
            amount: 0.25,
            unit: 'kg',
            notes: 'Plate scan: Beef steak'
          })
        }));
      });
    });
  });

  describe('Goals Page & Creation Flow', () => {
    test('renders current active goals', () => {
      useStore.setState({
        goals: [
          { _id: 'goal-1', title: 'Cycle to work', targetValue: 5, targetUnit: 'days', currentValue: 2, status: 'active', period: 'weekly', category: 'transport', milestones: [] }
        ]
      });

      render(<Goals />);

      expect(screen.getByText('Cycle to work')).toBeInTheDocument();
      expect(screen.getByText('2 / 5 days')).toBeInTheDocument();
    });

    test('submits new goal form values', async () => {
      useStore.setState({ goals: [] });
      render(<Goals />);

      const toggleFormBtn = screen.getByRole('button', { name: /\+ new goal/i });
      fireEvent.click(toggleFormBtn);

      // Check fields
      const titleInput = screen.getByPlaceholderText(/reduce transport/i);
      fireEvent.change(titleInput, { target: { value: 'Eat vegan meals' } });

      const amountInput = screen.getByPlaceholderText(/e\.g\./);
      fireEvent.change(amountInput, { target: { value: '20' } });

      const dateInput = screen.getByLabelText(/target date/i);
      fireEvent.change(dateInput, { target: { value: '2026-06-30' } });

      // Mock Goal API POST
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          goal: { _id: 'goal-2', title: 'Eat vegan meals', targetValue: 20, currentValue: 0, status: 'active', period: 'monthly', category: 'overall', targetUnit: 'percent' }
        })
      });

      const submitBtn = screen.getByRole('button', { name: /save goal/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/goals', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            title: 'Eat vegan meals',
            type: 'reduction_percentage',
            category: 'overall',
            targetValue: '20',
            targetUnit: 'percent',
            period: 'monthly',
            endDate: '2026-06-30'
          })
        }));
      });
    });
  });

  describe('Coach Page', () => {
    test('sends user message and displays advisor replies', async () => {
      render(<Coach />);

      expect(screen.getByText(/hi! i am your ai sustainability advisor/i)).toBeInTheDocument();

      const input = screen.getByPlaceholderText(/ask about your footprint/i);
      fireEvent.change(input, { target: { value: 'Is beef high carbon?' } });

      // Mock AI response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ text: 'Yes, beef generates about 27 kg CO2e per kg.' })
      });

      const sendBtn = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(screen.getByText('Yes, beef generates about 27 kg CO2e per kg.')).toBeInTheDocument();
      });
    });

    test('triggers weekly plan request on button click', async () => {
      render(<Coach />);

      // Mock AI response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ text: 'Here is your Weekly Action Plan.' })
      });

      const planBtn = screen.getByRole('button', { name: /generate weekly action plan/i });
      fireEvent.click(planBtn);

      await waitFor(() => {
        expect(screen.getByText('Here is your Weekly Action Plan.')).toBeInTheDocument();
      });
    });
  });
});
