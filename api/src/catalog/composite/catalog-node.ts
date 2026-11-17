import { Hall } from '../entities/hall.entity';
import { Section } from '../entities/section.entity';
import { SportsCenter } from '../entities/sports-center.entity';

export interface CatalogNodeView {
  kind: 'network' | 'center' | 'hall' | 'section';
  id: number | null;
  name: string;
  details: string;
  sectionCount: number;
  capacity: number;
  minPrice: number | null;
  children: CatalogNodeView[];
}

// Composite: network -> centers -> halls -> sections, uniform aggregates
export interface CatalogComponent {
  sectionCount(): number;
  capacity(): number;
  minPrice(): number | null;
  view(): CatalogNodeView;
}

export class SectionLeaf implements CatalogComponent {
  constructor(private readonly section: Section) {}

  sectionCount() {
    return 1;
  }

  capacity() {
    return this.section.capacity;
  }

  minPrice() {
    return this.section.pricePerVisit;
  }

  view(): CatalogNodeView {
    const s = this.section;
    return {
      kind: 'section',
      id: s.id,
      name: s.name,
      details: `${s.sport.name}, ${s.trainer?.fullName ?? 'без тренера'}`,
      sectionCount: 1,
      capacity: s.capacity,
      minPrice: s.pricePerVisit,
      children: [],
    };
  }
}

export class CatalogGroup implements CatalogComponent {
  private readonly children: CatalogComponent[] = [];

  constructor(
    private readonly kind: 'network' | 'center' | 'hall',
    private readonly id: number | null,
    private readonly name: string,
    private readonly details: string,
  ) {}

  add(child: CatalogComponent) {
    this.children.push(child);
    return this;
  }

  sectionCount() {
    return this.children.reduce((n, c) => n + c.sectionCount(), 0);
  }

  capacity() {
    return this.children.reduce((n, c) => n + c.capacity(), 0);
  }

  minPrice() {
    const prices = this.children.map((c) => c.minPrice()).filter((p): p is number => p !== null);
    return prices.length ? Math.min(...prices) : null;
  }

  view(): CatalogNodeView {
    return {
      kind: this.kind,
      id: this.id,
      name: this.name,
      details: this.details,
      sectionCount: this.sectionCount(),
      capacity: this.capacity(),
      minPrice: this.minPrice(),
      children: this.children.map((c) => c.view()),
    };
  }
}

export const buildCatalogTree = (centers: SportsCenter[], sections: Section[]) => {
  const root = new CatalogGroup('network', null, 'Мережа спортивних центрів', `Центрів: ${centers.length}`);
  for (const center of centers) {
    const centerNode = new CatalogGroup('center', center.id, center.name, `${center.city}, ${center.address}`);
    for (const hall of center.halls ?? []) {
      centerNode.add(hallNode(hall, sections.filter((s) => s.hall.id === hall.id)));
    }
    root.add(centerNode);
  }
  return root;
};

const hallNode = (hall: Hall, sections: Section[]) => {
  const node = new CatalogGroup('hall', hall.id, hall.name, `${hall.capacity} місць, ${hall.pricePerHour} грн/год`);
  sections.forEach((s) => node.add(new SectionLeaf(s)));
  return node;
};
