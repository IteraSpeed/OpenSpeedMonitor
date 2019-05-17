import {TestBed} from '@angular/core/testing';
import {HttpClientTestingModule, HttpTestingController, TestRequest} from '@angular/common/http/testing';
import {skip} from 'rxjs/operators';
import {FilmstripService} from './filmstrip.service';
import {WptResultDTO} from '../models/wptResult-dto.model';
import {Thumbnail} from '../models/thumbnail.model';

describe('FilmstripService', () => {
  let httpMock: HttpTestingController;
  let filmstripService: FilmstripService;

  const wptResultDTO: WptResultDTO = {
    data: {
      runs: {
        1: {
          firstView: {
            steps: [{
              videoFrames: [{
                time: 100,
                image: 'bild1'
              }, {
                time: 400,
                image: 'bild2'
              }]
            }]
          }
        }
      }
    }
  };

  const thumbnails: Thumbnail[] = [
    new Thumbnail(100, 'bild1'),
    new Thumbnail(400, 'bild2'),
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FilmstripService]
    });
    httpMock = TestBed.get(HttpTestingController);
    filmstripService = TestBed.get(FilmstripService);
  });

  it('should put request data into observable', (done) => {
    filmstripService.filmStripData$.pipe(skip(1)).subscribe(result => {
      expect(result).toEqual(thumbnails);
      done();
    });
    filmstripService.getFilmstripData();

    const mockRequest: TestRequest = httpMock.expectOne(req =>
      req.method === 'GET' && req.url.startsWith('https://prod.server01.wpt.iteratec.de')
    );
    mockRequest.flush(wptResultDTO);
    httpMock.verify();
  });

  it('fill up filmstrip list with interval steps and thumbnails', () => {
    const calculatedFilmstrip: Thumbnail[] = filmstripService.createFilmStrip(100, thumbnails);
    const expectedFilmstrip = [
      {time: 0, imageUrl: 'bild1', hasChange: true},
      {time: 100, imageUrl: 'bild1', hasChange: false},
      {time: 200, imageUrl: 'bild1', hasChange: false},
      {time: 300, imageUrl: 'bild1', hasChange: false},
      {time: 400, imageUrl: 'bild2', hasChange: true}
    ];

    expect(calculatedFilmstrip).toEqual(expectedFilmstrip);
  });
});
