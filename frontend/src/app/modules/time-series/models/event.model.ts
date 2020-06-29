export interface EventDTO {
  id: number;
  eventDate: Date;
  description: string;
  shortName: string;
}

export class TimeEvent implements EventDTO {
  id: number;
  eventDate: Date;
  description: string;
  shortName: string;

  constructor(id: number, eventDate: Date, description: string, shortName: string) {
    this.id = id;
    this.eventDate = eventDate;
    this.description = description;
    this.shortName = shortName;
  }
}
