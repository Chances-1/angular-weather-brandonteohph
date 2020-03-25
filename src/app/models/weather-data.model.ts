export class WeatherModel {
  date        :   Date;
  temperature :   WeatherData;
  humidity    :   WeatherData;

  constructor(date:Date, temperature:WeatherData, humidity:WeatherData){
    this.date = date;
    this.temperature = temperature;
    this.humidity = humidity;
  };
}
export class WeatherData{
  high  : number;
  low   : number;
  constructor(high:number, low:number){
    this.high = high;
    this.low = low;
  };
}