import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VisualContext from '@/components/VisualContext';
import type { ImageResult } from '@shared/types';

const mockImages: ImageResult[] = [
  {
    url: 'https://example.com/image1.jpg',
    thumbnail: 'https://example.com/thumb1.jpg',
    title: 'Test Image 1',
    source: 'example.com'
  },
  {
    url: 'https://example.com/image2.jpg',
    thumbnail: 'https://example.com/thumb2.jpg',
    title: 'Test Image 2',
    source: 'example.com'
  }
];

// Mock window.open
const mockOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockOpen,
  writable: true,
});

describe('VisualContext', () => {
  beforeEach(() => {
    mockOpen.mockClear();
  });

  it('renders visual context title and search link', () => {
    render(<VisualContext images={mockImages} word="test" isLoading={false} />);
    
    expect(screen.getByText('Visual Context')).toBeInTheDocument();
    expect(screen.getByText('Search Google Images')).toBeInTheDocument();
  });

  it('renders images in 3x2 grid', () => {
    render(<VisualContext images={mockImages} word="test" isLoading={false} />);
    
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    
    expect(images[0]).toHaveAttribute('src', 'https://example.com/thumb1.jpg');
    expect(images[0]).toHaveAttribute('alt', 'Test Image 1');
  });

  it('shows loading skeletons when isLoading is true', () => {
    render(<VisualContext images={[]} word="test" isLoading={true} />);
    
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(6); // 6 image placeholders
  });

  it('copies image URL to clipboard when image is clicked', async () => {
    const user = userEvent.setup();
    render(<VisualContext images={mockImages} word="test" isLoading={false} />);
    
    const imageContainer = screen.getAllByRole('img')[0].closest('div');
    if (imageContainer) {
      await user.click(imageContainer);
    }
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://example.com/image1.jpg'
    );
  });

  it('opens Google Images search when search link is clicked', async () => {
    const user = userEvent.setup();
    render(<VisualContext images={mockImages} word="test" isLoading={false} />);
    
    const searchLink = screen.getByText('Search Google Images');
    await user.click(searchLink);
    
    expect(mockOpen).toHaveBeenCalledWith(
      'https://www.google.com/search?q=test&tbm=isch',
      '_blank'
    );
  });

  it('displays helpful tip at the bottom', () => {
    render(<VisualContext images={mockImages} word="test" isLoading={false} />);
    
    expect(screen.getByText(/Visual context helps reinforce memory!/)).toBeInTheDocument();
    expect(screen.getByText(/"test"/)).toBeInTheDocument();
  });

  it('shows hover effects on images', () => {
    render(<VisualContext images={mockImages} word="test" isLoading={false} />);
    
    const imageContainers = document.querySelectorAll('.group');
    expect(imageContainers).toHaveLength(2);
    
    imageContainers.forEach(container => {
      expect(container).toHaveClass('hover:ring-2', 'hover:ring-primary-500');
    });
  });
});