import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Hall } from './hall.entity';

@Entity('sports_centers')
export class SportsCenter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  city: string;

  @Column()
  address: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @OneToMany(() => Hall, (h) => h.center)
  halls: Hall[];
}
