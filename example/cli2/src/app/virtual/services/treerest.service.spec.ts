import {
  async,
  getTestBed,
  TestBed
} from '@angular/core/testing';
import {
  BaseRequestOptions,
  Http,
  Response,
  ResponseOptions,
  XHRBackend
} from '@angular/http';
import {
  MockBackend,
  MockConnection
} from '@angular/http/testing';
import {TreeRestService} from './treerest.service';
import {TreeViewData} from '../models/treeview-data.model';

describe('Service: TreeRestService', () => {
  let backend: MockBackend;
  let service: TreeRestService;

  beforeEach(async(() => {

    TestBed.configureTestingModule({
      providers: [
        BaseRequestOptions,
        MockBackend,
        TreeRestService,
        {
          deps: [
            MockBackend,
            BaseRequestOptions
          ],
          provide: Http,
          useFactory: (backendM: MockBackend, defaultOptions: BaseRequestOptions) => {
            return new Http(backendM, defaultOptions);
          }
        }
      ]
    });

    const testbed = getTestBed();
    backend = testbed.get(MockBackend);
    service = testbed.get(TreeRestService);

  }));

  function setupConnections(backendM: MockBackend, options: any) {
    backendM.connections.subscribe((connection: MockConnection) => {
      if (connection.request.url === 'http://localhost:6634/tree') {
        const responseOptions = new ResponseOptions(options);
        const response = new Response(responseOptions);

        connection.mockRespond(response);
      }
    });
  }

  it('should return the list of nodes from server on success', () => {
    setupConnections(backend, {
      body: [
        {
          id: 1,
          name: '0001',
          type: 'root',
          encode: true,
          decode: 'http://localhost:6634/decode/1',
          parentId: 0,
          hasChildren: true,
          isExpanded: false
        }
      ],
      status: 200
    });

    service.paginate(0, 1).then((data: TreeViewData[]) => {
      expect(data.length).toBe(1);
      expect(data[0].name).toBe('0001');
    });

  });

  it('should log an error to the console on error', () => {
    setupConnections(backend, {
      body: {error: `Rest api error!`},
      status: 500
    });
    spyOn(console, 'error');

    service.paginate(0, 1).then(null, () => {
      expect(console.error).toHaveBeenCalledWith(`Rest api error!`);
    });
  });

});
