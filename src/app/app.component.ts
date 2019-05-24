import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { TradingService } from './trading.service';
import * as d3 from 'd3';
import { interval, Subscription } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {

  @ViewChild('pieElement') pieElement;

  subscription: Subscription;
  data = this.tradingService.getTradingData();

  CPT: number = 3;
  highFrequency: number = 5;
  lowFrequency: number = 15;

  previousFreq: number;
  currentFreq: number = this.lowFrequency * 1000;

  constructor(private tradingService: TradingService) {
    if (!this.data) {
      // First time in so no previous data stored in localStorage
      this.subscription = this.tradingService.pullData()
        .subscribe((response) => {
          this.dataCallback(response['data']);
          this.setIntervalSubscription();
        }, (error) => this.handleError(error));
    } else {
      // Data from previous session found, so we only need to set the interval subscription
      this.setIntervalSubscription();
    }
  }

  ngOnInit() {
    if (this.data) {
      this.pieChart();
    }
  }

  private dataCallback(data) {
    this.data = data;
    this.tradingService.setTradingData(this.data);
    this.setFrequency();
    this.pieChart();
  }

  private setIntervalSubscription() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    this.subscription = interval(this.currentFreq).pipe(
      switchMap(() => this.tradingService.pullData()),
      map((res: any)=> res.data)
    ).subscribe(data => this.dataCallback(data), (error) => this.handleError(error));
  }

  private setFrequency() {
    this.previousFreq = this.currentFreq;
    this.currentFreq = this.lowFrequency * 1000;

    const maxChangePct = Math.max(...this.data.map(d => d.change_pct));
    if (maxChangePct > this.CPT) {
      this.currentFreq = this.highFrequency * 1000;
    }

    if (this.previousFreq !== this.currentFreq) {
      this.setIntervalSubscription();
    }
  }

  private pieChart() {
    const width = 540;
    const height = 540;
    const radius = Math.min(width, height) / 2;

    d3.select(this.pieElement.nativeElement).select('svg').remove();
    const svg = d3.select(this.pieElement.nativeElement)
      .append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const color = d3.scaleOrdinal(["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f"]);

    const pie = d3.pie()
      .value((d: any) => d.price)
      .sort(null);

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    const path = svg.selectAll("path")
      .data(pie(this.data));
      
    d3.select('body').select('div.tooltip').remove();
    var div = d3.select("body").append("div")	
      .attr("class", "tooltip")				
      .style("opacity", 0)
      .style("position", "absolute")
      .style("text-align", "center")
      .style("border-radius", "5px")
      .style("padding", "6px")
      .style("color", "white")
      .style("background-color", "grey");

    path.enter().append("path")
      .attr("fill", (d: any, i: any) => color(i))
      .attr("d", <any>arc)
      .attr("stroke", "white")
      .attr("stroke-width", "6px")
      .on("mouseover", function(d: any) {	
        div.transition()		
            .duration(200)		
            .style("opacity", .9);
        div	.html(`${d.data.price} ${d.data.currency}`)	
            .style("left", (d3.event.pageX) + "px")		
            .style("top", (d3.event.pageY - 28) + "px");	
        })
      .on("mousemove", function(d) {
        div.style("left", (d3.event.pageX) + "px")		
        .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {		
        div.transition()		
            .duration(500)		
            .style("opacity", 0);	
      });
    
    path.enter().append('text')
      .text((d: any) => { 
        return `${d.data.symbol}`;
      })
      .attr("transform", function(d: any) { return "translate(" + arc.centroid(d) + ")";  })
      .style("text-anchor", "middle")
      .style("font-size", 17)
  }

  private handleError(error) {
    // TODO: Proper error handling / show error msg
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

}
