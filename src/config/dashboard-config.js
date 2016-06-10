import {inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {EventAggregator} from 'aurelia-event-aggregator';
import {AuthService} from 'aurelia-auth';
import {HttpClient} from 'aurelia-fetch-client';
import {DefaultHttpClient} from 'periscope-framework';
import {DashboardBehavior, ManageNavigationStackBehavior, DataSourceHandleBehavior, DataSourceChangedBehavior, ChangeRouteBehavior, ReplaceWidgetBehavior, CreateWidgetBehavior, SettingsHandleBehavior, DataFilterHandleBehavior, DataFieldSelectedBehavior, DataSelectedBehavior, DataActivatedBehavior, DataFilterChangedBehavior} from 'periscope-framework';
import {CacheManager, Datasource, JsonDataService, StaticSchemaProvider, MemoryCacheStorage, Factory, StaticJsonDataService} from 'periscope-framework';
import {AstToJavascriptParser, UserStateStorage, StateUrlParser, DashboardManager} from 'periscope-framework';
import {PermissionsManager, RoleProvider, DashboardConfiguration} from 'periscope-framework';

import {BootstrapDashboard, DefaultSearchBox, DefaultDetailedView, SwaggerDataSourceConfigurator} from 'periscope-ui';
import {GridDT} from 'periscope-widgets-datatables';
import {BarChart} from 'periscope-widgets-chartjs';

import {ElasticSearchDataService, AstToElasticSearchQueryParser, ElasticSearchSchemaProvider} from 'periscope-elastic-search';


@inject(EventAggregator,  UserStateStorage, DashboardManager, Router, Factory.of(CacheManager), HttpClient, DefaultHttpClient, AuthService, PermissionsManager, RoleProvider)
export class DefaultDashboardConfiguration extends DashboardConfiguration  {
  constructor(eventAggregator, userStateStorage, dashboardManager, router,  cacheManagerFactory, securedHttpClient, defaultHttpClient, authService, permissionsManager, roleProvider){
    super();
    this._eventAggregator = eventAggregator;
    this._router = router;
    this._dashboardManager = dashboardManager;
    this._stateStorage = userStateStorage;
    this._cacheManager = cacheManagerFactory(new MemoryCacheStorage());

    this._authService = authService;
    this._permissionsManager = permissionsManager;
    this._roleProvider = roleProvider;

    this._securedHttpClient = securedHttpClient;
    this._defaultHttpClient = defaultHttpClient;
  }
  
  invoke(){
    this._roleProvider.configure(config=>{
      config.withAuthService(this._authService).withRolesArray([])
    });
    this._permissionsManager.configure(config=>{
      config.withRoleProvider(this._roleProvider).withPermissionsMatrix([{
        resource: "positionsSearchWidget",
        roles: ['member','admin'],
        permissions:['r','w']
      },{
        resource: "gridWidget",
        roles: ['*'],
        permissions:['r','w']
      },{
        resource: "chartWidget",
        roles: ['member','admin'],
        permissions:['r','w']
      },{
        resource: "detailsWidgetCustomers",
        roles: ['admin'],
        permissions:['r','w']
      },{
        resource: "gridWidgetOrders",
        roles: ['member', 'admin'],
        permissions:['r','w']
      },{
        resource: "ordersSearchWidget",
        roles: ['member'],
        permissions:['r']
      },{
        resource: "ordersSearchWidget",
        roles: ['admin'],
        permissions:['r','w']
      },{
        resource: "detailsWidgetOrder",
        roles: ['member', 'admin'],
        permissions:['r','w']
      },{
        resource: "productsGridWidget",
        roles: ['member', 'admin'],
        permissions:['r','w']
      },{
        resource: "productsSearchWidget",
        roles: ['member', 'admin'],
        permissions:['r','w']
      },{
        resource: "detailsWidgetProducts",
        roles: ['member', 'admin'],
        permissions:['r','w']
      },{
        resource: "salesSearchWidget",
        roles: ['member', 'admin'],
        permissions:['r','w']
      },
        {
          resource: "gridWidgetSales",
          roles: ['member', 'admin'],
          permissions:['r','w']
        },
        {
          resource: "detailsWidgetSales",
          roles: ['member', 'admin'],
          permissions:['r','w']
        }
      ]);
    });
    let customersDataService = new StaticJsonDataService();
    customersDataService.configure({
        httpClient: this._securedHttpClient,
        url:'/data/customers.json',
        schemaProvider: new StaticSchemaProvider({
          fields:[
            {
              field:"Id",
              type:"string"
            },
            {
              field:"CompanyName",
              type:"string"
            },
            {
              field:"ContactName",
              type:"string"
            },
            {
              field:"ContactTitle",
              type:"string"
            },
            {
              field:"Address",
              type:"string"
            },
            {
              field:"City",
              type:"string"
            },
            {
              field:"Country",
              type:"string"
            },
            {
              field:"PostalCode",
              type:"string"
            },
            {
              field:"Phone",
              type:"string"
            },
            {
              field:"Fax",
              type:"string"
            }
          ]
        }),
        dataMapper: data=>{
          return data.Results
        },
        filterParser: new AstToJavascriptParser()
      }
    )
    let dsCustomers = new Datasource({
      name: "customers",
      cache: {
        cacheTimeSeconds: 120,
        cacheManager: this._cacheManager
      },
      transport:{
        readService: customersDataService
      }
    });
    //Search box
    let searchBox = new DefaultSearchBox({
      name:"positionsSearchWidget",
      header:"Positions",
      showHeader:false,
      dataSource: dsCustomers,
      dataFilter:"",
      stateStorage: this._stateStorage,
      behavior:[
        new DataFilterChangedBehavior("searchBoxChannel",this._eventAggregator)
      ]
    });

    //customers grid
    let customersGrid = new GridDT({
      name:"gridWidget",
      header:"Customers",
      showHeader:true,
      minHeight: 450,
      pageSize: 25,
      stateStorage: this._stateStorage,
      navigatable: true,
      behavior:[
        new DataFilterHandleBehavior("searchBoxChannel",this._eventAggregator),
        new DataSelectedBehavior("gridSelectionChannel",this._eventAggregator),
        new DataActivatedBehavior("gridCommandChannel",this._eventAggregator),
        new DataFieldSelectedBehavior("gridFieldSelectionChannel",this._eventAggregator)
      ],
      dataSource: dsCustomers,
      dataFilter:"",
      columns:[
        {
          field: "Id",
          title: "#"
        },
        {
          field: "ContactName",
          title: "Contact Name"
        },
        {
          field: "ContactTitle",
          title: "Contact Title",
          selectable: true
        },
        {
          field: "Country",
          selectable: true
        },
        {
          field: "City"
        }
      ],
      group: {
        field: "Country",
        dir: "asc"
      }
    });

    let chart = new BarChart({
      name:"chartWidget",
      header:"Country",
      categoriesField:"Country",
      dataSource: dsCustomers,
      showHeader:true,
      dataFilter:"",
      behavior:[
        new DataFilterHandleBehavior("searchBoxChannel", this._eventAggregator),
        new SettingsHandleBehavior(
          "gridFieldSelectionChannel",
          this._eventAggregator,
          message => {
            return {
              header: message.fieldName,
              categoriesField: message.fieldName
            };
          }
        )
      ],
      minHeight: 450
    });

    let changeRoureBefavior = new ChangeRouteBehavior({
        chanel: "gridCommandChannel",
        newRoute: '/orders',
        paramsMapper: filterEvent => {return StateUrlParser.stateToQuery([{
          key: "orders:ordersSearchWidget",
          value: {
            stateType: "searchBoxState",
            stateObject: "CustomerId = '" + filterEvent.activatedData["Id"].toString() + "'"
          }
        }])
        },
        eventAggregator: this._eventAggregator,
        router: this._router
      }
    );

    let createWidgetBehavior = new CreateWidgetBehavior(
      'gridSelectionChannel',
      DefaultDetailedView,
      {
        name:"detailsWidgetCustomers",
        header:"Customer details",
        behavior:[],
        dataSource: dsCustomers,
        showHeader:true
      },
      {sizeX:3, sizeY:"*", col:6, row:2},
      this._eventAggregator,
      message => {
        return {
            "left": {
              "field": "Id",
              "type": "string",
              "operand": "==",
              "value": message.selectedData["Id"].toString()
            }
          }
      }
    );


    let dbCustomers = this._dashboardManager.createDashboard(BootstrapDashboard, {
      name: "customers",
      title:"Customers"
    });
    dbCustomers.addWidget(searchBox, {sizeX:12, sizeY:1, col:1, row:1});
    dbCustomers.addWidget(customersGrid,{sizeX:6, sizeY:"*", col:1, row:2});
    dbCustomers.addWidget(chart, {sizeX:"*", sizeY:"*", col:7, row:2});

    changeRoureBefavior.attach(dbCustomers);
    createWidgetBehavior.attach(dbCustomers);

    // CONFIGURE ORDERS DASHBOARD
    let ordersDataService = new StaticJsonDataService();
    ordersDataService.configure({
        url:'/data/orders.json',
        httpClient: this._securedHttpClient,
        schemaProvider: new StaticSchemaProvider({
          fields:[
            {
              field:"Id",
              type:"string"
            },
            {
              field:"CustomerId",
              type:"string"
            },
            {
              field:"EmployeeId",
              type:"string"
            },
            {
              field:"OrderDate",
              type:"date"
            },
            {
              field:"RequiredDate",
              type:"date"
            },
            {
              field:"ShippedDate",
              type:"date"
            },
            {
              field:"ShipVia",
              type:"number"
            },
            {
              field:"Freight",
              type:"number"
            },
            {
              field:"ShipName",
              type:"string"
            },
            {
              field:"ShipAddress",
              type:"string"
            },
            {
              field:"ShipCity",
              type:"string"
            },
            {
              field:"ShipPostalCode",
              type:"string"
            },
            {
              field:"ShipCountry",
              type:"string"
            }
          ]
        }),
        dataMapper: data=>{
          return data.Results
        },
        filterParser: new AstToJavascriptParser()
      }
    );

    let dsOrders = new Datasource({
      name: "orders",
      cache: {
        cacheTimeSeconds: 120,
        cacheManager: this._cacheManager
      },
      transport:{
        readService: ordersDataService
      }
    });


    // Orders dashboard
    let ordersGrid = new GridDT({
      name:"gridWidgetOrders",
      header:"Orders",
      stateStorage: this._stateStorage,
      minHeight: 450,
      pageSize: 25,
      behavior:[
        new DataFilterHandleBehavior("ordersSearchChannel",this._eventAggregator),
        new DataActivatedBehavior("order-details",this._eventAggregator)
      ],
      dataSource: dsOrders,
      showHeader:true,
      dataFilter:"",
      columns:[
        {
          field: "Id",
          title: "#"
        },
        {
          field: "CustomerId",
          title: "Customer"
        },
        {
          field: "OrderDate",
          title: "Order Date",
          format: "MMM DD YYYY"
        }
        ,
        {
          field: "Freight"
        },
        {
          field: "ShipName",
          title: "Ship Name"
        },
        {
          field: "ShipCountry",
          title: "Ship Country"
        }
      ]
    });

    //Search box

    let ordersSearchBox = new DefaultSearchBox({
      name:"ordersSearchWidget",
      header:"Orders",
      showHeader:false,
      dataSource: dsOrders,
      dataFilter:"",
      stateStorage: this._stateStorage,
      behavior:[
        new DataFilterChangedBehavior("ordersSearchChannel",this._eventAggregator)
      ]
    });


    let dbOrders = this._dashboardManager.createDashboard(BootstrapDashboard,{
      name: "orders",
      title:"Orders"
    });
    dbOrders.addWidget(ordersSearchBox, {sizeX:12, sizeY:1, col:1, row:1});
    dbOrders.addWidget(ordersGrid, {sizeX:12, sizeY:'*', col:1, row:2});
    var replaceWidgetBehavior = new ReplaceWidgetBehavior(
      'order-details',
      this._eventAggregator,
      "gridWidgetOrders",
      DefaultDetailedView,
      {
        name:"detailsWidgetOrder",
        header:"Order Details",
        behavior:[],
        dataSource: dsOrders,
        showHeader:true
      },
      message => {
        return {
            "left": {
              "field": "Id",
              "type": "number",
              "operand": "==",
              "value": message.activatedData["Id"].toString()
            }
          }
      }
    );
    let manageNavigationStackBehavior = new ManageNavigationStackBehavior(this._eventAggregator);
    replaceWidgetBehavior.attach(dbOrders);
    manageNavigationStackBehavior.attach(dbOrders);


    // CONFIGURE SWAGGER-BASED DASHBOARD
    /*
    let swaggerDataService = new JsonDataService();
    swaggerDataService.configure({
      httpClient: this._defaultHttpClient
    });

    let dsSwagger = new Datasource({
      name: "datasource",
      cache: {
        cacheTimeSeconds: 120,
        cacheManager: this._cacheManager
      },
      transport:{
        readService: swaggerDataService
      }
    });


    //customers grid
    let swGrid = new GridDT({
      name:"swaggerGridWidget",
      header:"Swagger Data",
      showHeader:true,
      minHeight: 450,
      pageSize: 40,
      stateStorage: this._stateStorage,
      navigatable: true,
      autoGenerateColumns: true,
      behavior:[
        new DataSourceHandleBehavior("dataSourceConfigChannel",this._eventAggregator)
      ],
      dataFilter:""
    });


    let swgConfiguratorWidget =  new SwaggerDataSourceConfigurator({
      name:"dsConfiguratorWidget",
      header:"Swagger Configuration",
      showHeader:true,
      minHeight: 450,
      stateStorage: this._stateStorage,
      definitionsUrl: "http://petstore.swagger.io/v2/swagger.json",
      dataSourceToConfigurate: dsSwagger,
      behavior:[
        new DataSourceChangedBehavior("dataSourceConfigChannel",this._eventAggregator),
      ]
    });



    let dbSwagger = this._dashboardManager.createDashboard(BootstrapDashboard, "swagger-api",{
      name: "swagger-api",
      title:"Swagger"
    });
    dbSwagger.addWidget(swgConfiguratorWidget,{sizeX:4, sizeY:"*", col:1, row:1});
    dbSwagger.addWidget(swGrid,{sizeX:8, sizeY:"*", col:5, row:1});
*/
    // ELASTIC SEARCH


    let esSchemeProvider = new ElasticSearchSchemaProvider(this._defaultHttpClient, "http://ec2-52-87-247-51.compute-1.amazonaws.com:9200/contoso/","contoso", "products");

    let esProductsDataService = new ElasticSearchDataService();
    esProductsDataService.configure({
      httpClient: this._defaultHttpClient,
      url:'http://ec2-52-87-247-51.compute-1.amazonaws.com:9200/contoso/products/',
      schemaProvider: esSchemeProvider,
      filterParser: new AstToElasticSearchQueryParser()
    });

    let  dsProducts = new Datasource({
      name: "products",
      transport:{
        readService: esProductsDataService
      }
    });

    //Search box
    let searchBoxProducts = new DefaultSearchBox({
      name:"productsSearchWidget",
      header:"Products",
      showHeader:false,
      dataSource: dsProducts,
      dataFilter:"",
      stateStorage: this._stateStorage,
      behavior:[
        new DataFilterChangedBehavior("productsSearchBoxChannel",this._eventAggregator)
      ]
    });


    let productsGrid = new GridDT({
      name:"productsGridWidget",
      header:"Products",
      showHeader:true,
      minHeight: 450,
      pageSize: 40,
      stateStorage: this._stateStorage,
      navigatable: true,
      dataFilter:"",
      dataSource:dsProducts,
      behavior:[
        new DataFilterHandleBehavior("productsSearchBoxChannel",this._eventAggregator),
        new DataSelectedBehavior("productSelectionChannel",this._eventAggregator),
        new DataActivatedBehavior("productsGridCommandChannel",this._eventAggregator),
      ],
      columns:[
        {
          field: "ProductKey",
          title: "#"
        },
        {
          field: "ProductName",
          title: "Name"
        },
        {
          field: "Status"
        },
        {
          field: "Manufacturer"
        }
        ,
        {
          field: "Weight"
        },
        {
          field: "Size"
        }
      ]
    });

    let createProductWidgetBehavior = new CreateWidgetBehavior(
      'productSelectionChannel',
      DefaultDetailedView,
      {
        name:"detailsWidgetProducts",
        header:"Product details",
        behavior:[],
        dataSource: dsProducts,
        showHeader:true
      },
      {sizeX:3, sizeY:"*", col:6, row:2},
      this._eventAggregator,
      message => { return {
          "left": {
            "field": "ProductKey",
            "type": "string",
            "operand": "==",
            "value": message.selectedData["ProductKey"].toString()
          }
        }
      }
    );
    let changeProductsRoureBefavior = new ChangeRouteBehavior({
        chanel: "productsGridCommandChannel",
        newRoute: '/sales',
        paramsMapper: filterEvent => {return StateUrlParser.stateToQuery([{
          key: "sales:salesSearchWidget",
          value: {
            stateType: "searchBoxState",
            stateObject: "ProductKey = '" + filterEvent.activatedData["ProductKey"].toString() + "'"
          }
        }])
        },
        eventAggregator: this._eventAggregator,
        router: this._router
      }
    );


    let dbProducts = this._dashboardManager.createDashboard(BootstrapDashboard, {
      name: "products",
      title:"Products (ElasicSearch)",
    });
    dbProducts.addWidget(searchBoxProducts, {sizeX:12, sizeY:1, col:1, row:1});
    dbProducts.addWidget(productsGrid,{sizeX:9, sizeY:"*", col:1, row:2});
    createProductWidgetBehavior.attach(dbProducts);
    changeProductsRoureBefavior.attach(dbProducts);

    // sales
    let dbSales = this._dashboardManager.createDashboard(BootstrapDashboard, {
      name: "sales",
      title:"Sales (ElasicSearch)"
    });

    let salesSchemeProvider = new ElasticSearchSchemaProvider(this._defaultHttpClient, "http://ec2-52-87-247-51.compute-1.amazonaws.com:9200/contoso/","contoso", "sales");

    let esSalesDataService = new ElasticSearchDataService();
    esSalesDataService.configure({
      httpClient: this._defaultHttpClient,
      url:'http://ec2-52-87-247-51.compute-1.amazonaws.com:9200/contoso/sales/',
      schemaProvider: salesSchemeProvider,
      filterParser: new AstToElasticSearchQueryParser()
    });
    let  dsSales = new Datasource({
      name: "products",
      transport:{
        readService: esSalesDataService
      }
    });

    //Search box

    let salesSearchBox = new DefaultSearchBox({
      name:"salesSearchWidget",
      header:"Sales",
      showHeader:false,
      dataSource: dsSales,
      dataFilter:"",
      stateStorage: this._stateStorage,
      behavior:[
        new DataFilterChangedBehavior("salesSearchChannel",this._eventAggregator)
      ]
    });

    let salesGrid = new GridDT({
      name:"gridWidgetSales",
      header:"Sales",
      stateStorage: this._stateStorage,
      minHeight: 450,
      pageSize: 25,
      behavior:[
        new DataFilterHandleBehavior("salesSearchChannel",this._eventAggregator),
        new DataActivatedBehavior("sales-details",this._eventAggregator)
      ],
      dataSource: dsSales,
      showHeader:true,
      dataFilter:"",
      columns:[
        {
          field: "SalesKey",
          title: "#"
        },
        {
          field: "ProductKey",
          title: "Product #"
        }
        ,
        {
          field: "SalesAmount",
          title: "Sales Amount"
        }
        ,
        {
          field: "ProductInfo_ProductName",
          title: "Product Name"
        },
        {
          field: "ProductInfo_ColorName",
          title: "Color"
        },
        {
          field: "ProductInfo_BrandName",
          title: "Brand"
        }
      ]
    });

    let replaceSalesGridBehavior = new ReplaceWidgetBehavior(
      'sales-details',
      this._eventAggregator,
      "gridWidgetSales",
      DefaultDetailedView,
      {
        name:"detailsWidgetSales",
        header:"Sales Details",
        behavior:[],
        dataSource: dsSales,
        showHeader:true
      },
      message => {
        return {
            "left": {
              "field": "SalesKey",
              "type": "number",
              "operand": "==",
              "value": message.activatedData["SalesKey"].toString()
            }
          }
      }
    );

    dbSales.addWidget(salesSearchBox, {sizeX:12, sizeY:1, col:1, row:1});
    dbSales.addWidget(salesGrid, {sizeX:12, sizeY:'*', col:1, row:2});
    replaceSalesGridBehavior.attach(dbSales);
  }
}
