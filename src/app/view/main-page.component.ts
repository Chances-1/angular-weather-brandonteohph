import { Component, HostListener, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Observable, forkJoin }  from 'rxjs';
import * as Plotly from 'plotly.js';
import { WeatherModel, WeatherData } from '../models/weather-data.model';
import { FormControl } from '@angular/forms';


@Component({
  selector: 'main-page',
  templateUrl: 'main-page.component.html',
  styleUrls: ['main-page.component.css'],
  providers: [DatePipe, HttpClient]
})
export class MainPageComponent  {


  @ViewChild('chartTemperature', {static: false})
  chartTemp:ElementRef;

  @ViewChild('chartHumidity', {static: false})
  chartHumid:ElementRef;

  private gridApi;
  private gridColumnApi;

  table_columnDefs = [];
  table_rowData = [];
  table_defaultColDef;

  dateInput = new FormControl(new Date());
  dateDisplay = new Date();

  weatherModels: WeatherModel[] = [];

  url_getWeatherData="https://api.data.gov.sg/v1/environment/4-day-weather-forecast";

  constructor(private http: HttpClient,
            private datePipe: DatePipe){}

    
  ngOnInit() {


    this.table_columnDefs = [ 
      // date
      {
        headerName:'Date',
        field: 'date',
        sort: 'asc'
      },
      // temperature
      {
        headerName:'Temperature',
        children:[
          {
            headerName: 'High',
            field:'tempHigh'
          },
          {
            headerName: 'Low',
            field:'tempLow'
          }
        ]
      },
      // Humidity
      {
        headerName:'Humidity',
        children:[
          {
            headerName: 'High',
            field:'humiHigh'
          },
          {
            headerName: 'Low',
            field:'humiLow'
          }
        ]
      }
    ];
    // set table data here
    this.getWeatherData();

    this.table_defaultColDef = {
      sortable: true,
      filter: true,
    };
  }

  // Gets weather data from api.data.gov.sg
  getWeatherData(){
    this.weatherModels = [];

    const date = new Date(this.dateInput.value);
    date.setDate(date.getDate() - 28);

    let array_url = [];
    for(let i = 1; i<7 ; i++){
      let url_dte = this.url_getWeatherData + "?date=" + this.datePipe.transform(date.setDate(date.getDate() + 4), "yyyy-MM-dd");    
      array_url.push(url_dte);
    }

    // create array of observables
    const observableArray: Array<Observable<any>> = array_url.map((url) => this.http.get(url));

    // merge all observables into one
    forkJoin(observableArray).subscribe((data: Array<any>) => {

        // process every http response
        data.forEach((response: any) => {
            const forecasts_pull = response.items[0].forecasts;

            forecasts_pull.forEach((forecast: any) => {

                this.weatherModels.push(new WeatherModel(
                  forecast.date, 
                  new WeatherData(
                    forecast.temperature.high,
                    forecast.temperature.low
                  ), 
                  new WeatherData(
                    forecast.relative_humidity.high,
                    forecast.relative_humidity.low
                  ),
                ));
            })
        })
        this.updateWeatherData();
     }); 
   
  }

  updateWeatherData(){
    this.dateDisplay = this.dateInput.value;
    this.constructTables();
    this.constructCharts();
  }
  
  onGridReady(params: any) {
      this.gridApi = params.api;
      this.gridColumnApi = params.columnApi;
      this.gridApi.sizeColumnsToFit();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.gridApi.sizeColumnsToFit();
  }

  constructTables(){
    this.table_rowData = [];
    this.weatherModels.forEach(weatherModel => {
      this.table_rowData.push({
          date: weatherModel.date,   
          tempHigh: weatherModel.temperature.high,   
          tempLow: weatherModel.temperature.low,   
          humiHigh: weatherModel.humidity.high,   
          humiLow: weatherModel.humidity.low
      })
    });
    this.gridApi.setRowData(this.table_rowData);
  }

  constructCharts() {
    const chartTempElement = this.chartTemp.nativeElement;
    const chartHumidElement = this.chartHumid.nativeElement;

    let dates = [];
    let tempHighs = [];
    let tempLows = [];
    let humiHighs = [];
    let humiLows = [];

    var chartTempLayout = {
      title: {
        text:'Temperatures',
        font: {
          family: 'Arial',
          size: 20
        },
        xref: 'paper'
      },
      xaxis: {
        title: {
          text: 'Date',
          font: {
            family: 'Arial',
            size: 18
          }
        },
      },
      yaxis: {
        title: {
          text: 'Temps',
          font: {
            family: 'Arial',
            size: 18
          }
        }
      },
      autosize: true,
      width: 350,
      height: 350,
    }
    var chartHumiLayout = {
      title: {
        text:'Relative Humidity',
        font: {
          family: 'Arial',
          size: 20
        },
        xref: 'paper'
      },
      xaxis: {
        title: {
          text: 'Date',
          font: {
            family: 'Arial',
            size: 18
          }
        },
      },
      yaxis: {
        title: {
          text: 'Temps',
          font: {
            family: 'Arial',
            size: 18
          }
        }
      },
      autosize: true,
      width: 350,
      height: 350,
    }
    this.weatherModels.forEach(weatherModel => {
        dates.push(weatherModel.date);
        tempHighs.push(weatherModel.temperature.high);
        tempLows.push(weatherModel.temperature.low);
        humiHighs.push(weatherModel.humidity.high);
        humiLows.push(weatherModel.humidity.low);
    });

    // temperature chart
    const dataTemperature: Plotly.BarData[] = [
      {
        x: dates,
        y: tempHighs,
        type: 'line',
        name: 'Highs'
      },{
        x: dates,
        y: tempLows,
        type: 'line',
        name: 'Lows'
      }
      
      ];

    Plotly.newPlot(chartTempElement, dataTemperature, chartTempLayout);

    // humidity chart
    const dataHumidity: Plotly.BarData[] = [
      {
        x: dates,
        y: tempHighs,
        type: 'line',
        name: 'Highs'
      },{
        x: dates,
        y: tempLows,
        type: 'line',
        name: 'Lows'
      }];


      Plotly.newPlot(chartHumidElement, dataHumidity, chartHumiLayout);
  }

  updateDateInput(date:any){
    this.dateInput = date;
  }

}